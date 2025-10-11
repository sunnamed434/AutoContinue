interface AutoContinueStats {
  enabled: boolean;
  autoContinueCount: number;
  timeSaved: number;
  lastReset: number;
}

class PopupController {
  private enabledToggle: HTMLInputElement;
  private statusText: HTMLElement;
  private continueCount: HTMLElement;
  private timeSaved: HTMLElement;
  private resetStatsBtn: HTMLButtonElement;
  private testPopupBtn: HTMLButtonElement;
  private openOptionsBtn: HTMLButtonElement;

  constructor() {
    try {
      this.initializeElements();
      this.loadSettings();
      this.setupEventListeners();
    } catch (error) {
      console.error('[AutoContinue Popup] Error in PopupController constructor:', error);
    }
  }

  private initializeElements(): void {
    this.enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
    this.statusText = document.getElementById('status-text') as HTMLElement;
    this.continueCount = document.getElementById('continue-count') as HTMLElement;
    this.timeSaved = document.getElementById('time-saved') as HTMLElement;
    this.resetStatsBtn = document.getElementById('reset-stats') as HTMLButtonElement;
    this.testPopupBtn = document.getElementById('test-popup') as HTMLButtonElement;
    this.openOptionsBtn = document.getElementById('open-options') as HTMLButtonElement;
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([
        'enabled',
        'autoContinueCount',
        'timeSaved',
        'lastReset',
      ]);

      const stats: AutoContinueStats = {
        enabled: result.enabled !== false, // Default to true
        autoContinueCount: result.autoContinueCount || 0,
        timeSaved: result.timeSaved || 0,
        lastReset: result.lastReset || Date.now(),
      };

      this.updateUI(stats);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private updateUI(stats: AutoContinueStats): void {
    this.enabledToggle.checked = stats.enabled;
    this.updateStatusText(stats.enabled);
    this.continueCount.textContent = stats.autoContinueCount.toString();
    this.timeSaved.textContent = this.formatTime(stats.timeSaved);
    const manifest = chrome.runtime.getManifest();
    const versionElement = document.querySelector('.version');
    if (versionElement) {
      versionElement.textContent = `v${manifest.version}`;
    }
  }

  private updateStatusText(enabled: boolean): void {
    this.statusText.textContent = enabled ? 'Enabled' : 'Disabled';
    this.statusText.className = enabled ? '' : 'disabled';
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  private setupEventListeners(): void {
    this.enabledToggle.addEventListener('change', async () => {
      const enabled = this.enabledToggle.checked;
      await chrome.storage.local.set({ enabled });
      this.updateStatusText(enabled);

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'toggle', enabled });
        }
      } catch (error) {
        console.error('Failed to notify content script:', error);
      }
    });

    this.resetStatsBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all statistics?')) {
        await chrome.storage.local.set({
          autoContinueCount: 0,
          timeSaved: 0,
          lastReset: Date.now(),
        });
        await this.loadSettings();
      }
    });

    this.testPopupBtn.addEventListener('click', async () => {
      const originalText = this.testPopupBtn.textContent;
      try {
        this.testPopupBtn.textContent = 'Testing...';
        this.testPopupBtn.disabled = true;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('[AutoContinue Popup] Current tab:', tab);

        if (tab?.id && tab.url) {
          console.log('[AutoContinue Popup] Sending test message to content script...');

          try {
            console.log('[AutoContinue Popup] Attempting to send message to tab:', tab.id);
            await chrome.tabs.sendMessage(tab.id, { action: 'testPopup' });
            console.log(
              '[AutoContinue Popup] Message sent successfully to content script - test popup should appear on the website'
            );
          } catch (messageError) {
            console.log(
              '[AutoContinue Popup] Failed to send message to content script:',
              messageError
            );
            console.log('[AutoContinue Popup] Trying to inject content script manually...');

            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['js/content.js'],
              });
              console.log('[AutoContinue Popup] Content script injected manually');

              setTimeout(async () => {
                try {
                  await chrome.tabs.sendMessage(tab.id, { action: 'testPopup' });
                  console.log(
                    '[AutoContinue Popup] Message sent successfully after manual injection - test popup should appear on the website'
                  );
                } catch (retryError) {
                  console.log(
                    '[AutoContinue Popup] Still failed after manual injection, using fallback'
                  );
                  showFallbackTestPopup();
                }
              }, 500);
            } catch (injectError) {
              console.log(
                '[AutoContinue Popup] Failed to inject content script manually:',
                injectError
              );
              console.log('[AutoContinue Popup] Using fallback test popup in extension popup');
              showFallbackTestPopup();
            }
          }
        } else {
          console.log('[AutoContinue Popup] No active tab, cannot show test popup');
          alert('Please open a webpage to test the AutoContinue functionality.');
        }

        setTimeout(() => {
          this.testPopupBtn.textContent = originalText;
          this.testPopupBtn.disabled = false;
        }, 1000);
      } catch (error) {
        console.error('[AutoContinue Popup] Failed to test popup:', error);
        this.testPopupBtn.textContent = originalText;
        this.testPopupBtn.disabled = false;
        showFallbackTestPopup();
      } finally {
        // Ensure button is always reset
        setTimeout(() => {
          this.testPopupBtn.textContent = originalText;
          this.testPopupBtn.disabled = false;
        }, 100);
      }
    });

    this.openOptionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
}

function showFallbackTestPopup(): void {
  console.log('[AutoContinue Popup] Content script injection failed, showing simple alert');
  alert(
    'AutoContinue Test\n\nThis demonstrates how AutoContinue automatically dismisses YouTube\'s "Continue watching?" popup.\n\nAutoContinue would have automatically clicked "Continue watching".\n\nGo to a YouTube video page to test the real functionality.'
  );
}

function showTestResult(message: string, type: 'success' | 'info'): void {
  const resultDiv = document.createElement('div');
  resultDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    z-index: 10001;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    max-width: 300px;
  `;
  resultDiv.textContent = message;

  document.body.appendChild(resultDiv);

  // Remove after 3 seconds
  setTimeout(() => {
    if (document.body.contains(resultDiv)) {
      document.body.removeChild(resultDiv);
    }
  }, 3000);
}

function setupFallbackButtons(): void {
  console.log('[AutoContinue Popup] Setting up fallback buttons...');

  const testBtn = document.getElementById('test-popup');
  if (testBtn && !testBtn.onclick) {
    console.log('[AutoContinue Popup] Setting up fallback test button');
    testBtn.onclick = function () {
      alert(
        'AutoContinue Test\n\nThis demonstrates how AutoContinue automatically dismisses YouTube\'s "Continue watching?" popup.\n\nAutoContinue would have automatically clicked "Continue watching".\n\nGo to a YouTube video page to test the real functionality.'
      );
    };
  }

  const settingsBtn = document.getElementById('open-options');
  if (settingsBtn && !settingsBtn.onclick) {
    console.log('[AutoContinue Popup] Setting up fallback settings button');
    settingsBtn.onclick = function () {
      chrome.runtime.openOptionsPage();
    };
  }

  const resetBtn = document.getElementById('reset-stats');
  if (resetBtn && !resetBtn.onclick) {
    console.log('[AutoContinue Popup] Setting up fallback reset button');
    resetBtn.onclick = function () {
      if (confirm('Are you sure you want to reset all statistics?')) {
        chrome.storage.local.set({
          autoContinueCount: 0,
          timeSaved: 0,
          lastReset: Date.now(),
        });
        alert('Statistics reset successfully!');
        location.reload();
      }
    };
  }

  const toggle = document.getElementById('enabled-toggle') as HTMLInputElement;
  if (toggle && !toggle.onchange) {
    console.log('[AutoContinue Popup] Setting up fallback toggle');
    toggle.onchange = function () {
      const enabled = this.checked;
      chrome.storage.local.set({ enabled });
      const statusText = document.getElementById('status-text');
      if (statusText) {
        statusText.textContent = enabled ? 'Enabled' : 'Disabled';
        statusText.className = enabled ? '' : 'disabled';
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[AutoContinue Popup] DOM loaded, initializing popup controller...');
  try {
    new PopupController();
    console.log('[AutoContinue Popup] Popup controller initialized successfully');
  } catch (error) {
    console.error('[AutoContinue Popup] Failed to initialize popup controller:', error);
    console.log('[AutoContinue Popup] Falling back to simple button handlers...');
    setupFallbackButtons();
  }
});

if (document.readyState === 'loading') {
  console.log('[AutoContinue Popup] DOM is still loading, waiting for DOMContentLoaded...');
} else {
  console.log('[AutoContinue Popup] DOM already ready, initializing immediately...');
  try {
    new PopupController();
    console.log('[AutoContinue Popup] Popup controller initialized successfully (immediate)');
  } catch (error) {
    console.error('[AutoContinue Popup] Failed to initialize popup controller (immediate):', error);
    console.log('[AutoContinue Popup] Falling back to simple button handlers...');
    setupFallbackButtons();
  }
}

setTimeout(() => {
  const testBtn = document.getElementById('test-popup');
  if (testBtn && !testBtn.onclick) {
    console.log('[AutoContinue Popup] Setting up delayed fallback test button');
    testBtn.onclick = function () {
      alert(
        'AutoContinue Test\n\nThis demonstrates how AutoContinue automatically dismisses YouTube\'s "Continue watching?" popup.\n\nAutoContinue would have automatically clicked "Continue watching".\n\nGo to a YouTube video page to test the real functionality.'
      );
    };
  }
}, 100);
