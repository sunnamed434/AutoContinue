import { formatTime } from '../utils/formatters';

interface AutoContinueStats {
  enabled: boolean;
  autoContinueCount: number;
  timeSaved: number;
  lastReset: number;
  theme: 'light' | 'dark';
  testMode: boolean;
}

class PopupController {
  private enabledToggle!: HTMLInputElement;
  private statusText!: HTMLElement;
  private continueCount!: HTMLElement;
  private timeSaved!: HTMLElement;
  private testPopupBtn!: HTMLButtonElement;
  private openOptionsBtn!: HTMLButtonElement;
  private themeToggle!: HTMLInputElement;
  private videoStatus!: HTMLElement;
  private refreshTabBtn!: HTMLButtonElement;
  private copyDebugLogsBtn!: HTMLButtonElement;
  private testSection!: HTMLElement;

  constructor() {
    try {
      this.initializeElements();
      this.loadSettings().catch(error => {
        console.error('[AutoContinue Popup] Failed to load settings:', error);
      });
      this.setupEventListeners();
      this.setupSystemThemeListener();
      this.setupStorageListener();
    } catch (error) {
      console.error('[AutoContinue Popup] Error in PopupController constructor:', error);
      this.setupFallbackUI();
    }
  }

  private setupFallbackUI(): void {
    try {
      const container = document.querySelector('.container');
      if (container) {
        container.textContent = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';

        const h2 = document.createElement('h2');
        h2.textContent = 'AutoContinue';

        const p = document.createElement('p');
        p.textContent = 'Extension loaded with limited functionality. Please refresh the page.';

        const button = document.createElement('button');
        button.textContent = 'Close';
        button.onclick = () => window.close();

        errorDiv.appendChild(h2);
        errorDiv.appendChild(p);
        errorDiv.appendChild(button);
        container.appendChild(errorDiv);
      }
    } catch (error) {
      console.error('[AutoContinue Popup] Failed to setup fallback UI:', error);
    }
  }

  private initializeElements(): void {
    this.enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
    this.statusText = document.getElementById('status-text') as HTMLElement;
    this.continueCount = document.getElementById('continue-count') as HTMLElement;
    this.timeSaved = document.getElementById('time-saved') as HTMLElement;
    this.testPopupBtn = document.getElementById('test-popup') as HTMLButtonElement;
    this.openOptionsBtn = document.getElementById('open-options') as HTMLButtonElement;
    this.themeToggle = document.getElementById('theme-toggle') as HTMLInputElement;
    this.videoStatus = document.getElementById('video-status') as HTMLElement;
    this.refreshTabBtn = document.getElementById('refresh-tab') as HTMLButtonElement;
    this.copyDebugLogsBtn = document.getElementById('copy-debug-logs') as HTMLButtonElement;
    this.testSection = document.getElementById('test-section') as HTMLElement;
  }

  private async loadSettings(): Promise<void> {
    try {
      const config = await chrome.storage.local.get([
        'enabled',
        'autoContinueCount',
        'timeSaved',
        'lastReset',
        'theme',
        'testMode',
      ]);

      if (!config) {
        return;
      }

      const systemTheme = this.detectSystemTheme();

      const stats: AutoContinueStats = {
        enabled: config.enabled,
        autoContinueCount: config.autoContinueCount,
        timeSaved: config.timeSaved,
        lastReset: config.lastReset,
        theme: systemTheme,
        testMode: config.testMode,
      };

      this.updateUI(stats);
      setTimeout(() => this.checkVideoStatus(), 1000);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private detectSystemTheme(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  private setupSystemThemeListener(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', async e => {
        const result = await chrome.storage.local.get(['theme']);
        if (!result['theme']) {
          const newTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(newTheme);
          this.themeToggle.checked = newTheme === 'dark';
        }
      });
    }
  }

  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        try {
          if (changes.autoContinueCount) {
            this.continueCount.textContent = changes.autoContinueCount.newValue.toString();
          }
          if (changes.timeSaved) {
            this.timeSaved.textContent = formatTime(changes.timeSaved.newValue);
          }
        } catch (error) {
          console.error('[AutoContinue Popup] Error updating stats from storage changes:', error);
        }
      }
    });
  }

  private updateUI(stats: AutoContinueStats): void {
    this.enabledToggle.checked = stats.enabled;
    this.updateStatusText(stats.enabled);
    this.continueCount.textContent = stats.autoContinueCount.toString();
    this.timeSaved.textContent = formatTime(stats.timeSaved);
    this.themeToggle.checked = stats.theme === 'dark';
    this.applyTheme(stats.theme);
    this.testSection.style.display = stats.testMode ? 'block' : 'none';
    this.copyDebugLogsBtn.style.display = stats.testMode ? 'block' : 'none';

    const manifest = chrome.runtime.getManifest();
    const versionElement = document.querySelector('.version');
    if (versionElement) {
      versionElement.textContent = `v${manifest.version}`;
    }
  }

  private updateStatusText(enabled: boolean): void {
    this.statusText.textContent = enabled ? 'Skipping is enabled' : 'Skipping is disabled';
    this.statusText.className = enabled ? '' : 'disabled';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.body.setAttribute('data-theme', theme);
  }

  private async checkVideoStatus(retryCount: number = 0): Promise<void> {
    const maxRetries = 3;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url) {
        const isYouTube = tab.url.includes('youtube.com') || tab.url.includes('music.youtube.com');
        if (!isYouTube) {
          this.videoStatus.style.display = 'none';
          return;
        }

        try {
          if (retryCount === 0) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['js/content.js'],
              });
              console.log('[AutoContinue] Content script injected manually');
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (injectError) {
              console.log('[AutoContinue] Could not inject content script:', injectError);
            }
          }

          const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkVideo' });
          console.log('[AutoContinue] Video status response:', response);

          if (response && response.hasVideo) {
            this.videoStatus.style.display = 'none';
          } else {
            this.videoStatus.style.display = 'block';

            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 3000);
              setTimeout(() => this.checkVideoStatus(retryCount + 1), delay);
            } else {
              console.log('[AutoContinue] Max retries reached for video detection');
            }
          }
        } catch (error) {
          console.error('[AutoContinue] Error checking video status:', error);

          if (
            error instanceof Error &&
            error.message &&
            error.message.includes('Could not establish connection')
          ) {
            console.log('[AutoContinue] Content script not ready, will retry...');
            if (retryCount < maxRetries) {
              const delay = Math.min(1500 * Math.pow(2, retryCount), 5000);
              setTimeout(() => this.checkVideoStatus(retryCount + 1), delay);
            } else {
              this.videoStatus.style.display = 'block';
              const statusMessage = this.videoStatus.querySelector(
                '.status-message'
              ) as HTMLElement;
              if (statusMessage) {
                statusMessage.textContent = 'Content script not ready. Please refresh the page.';
              }
            }
          } else if (
            error instanceof Error &&
            error.message &&
            error.message.includes('Extension context invalidated')
          ) {
            this.videoStatus.style.display = 'block';
            const statusMessage = this.videoStatus.querySelector('.status-message') as HTMLElement;
            if (statusMessage) {
              statusMessage.textContent = 'Extension context invalidated. Please reload the page.';
            }
          } else {
            this.videoStatus.style.display = 'block';
          }
        }
      }
    } catch (error) {
      console.error('Failed to check video status:', error);
    }
  }

  private setupEventListeners(): void {
    this.enabledToggle.addEventListener('change', async () => {
      const enabled = this.enabledToggle.checked;

      const config = await chrome.storage.local.get([
        'enabled',
        'autoContinueCount',
        'timeSaved',
        'lastReset',
        'theme',
        'testMode',
      ]);
      if (config) {
        config.enabled = enabled;
      }

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

    this.themeToggle.addEventListener('change', async () => {
      const theme = this.themeToggle.checked ? 'dark' : 'light';
      await chrome.storage.local.set({ theme });
      this.applyTheme(theme);
    });

    this.refreshTabBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.reload(tab.id);
          window.close();
        }
      } catch (error) {
        console.error('Failed to refresh tab:', error);
      }
    });

    this.copyDebugLogsBtn.addEventListener('click', async () => {
      try {
        const result = await chrome.storage.local.get([
          'enabled',
          'autoContinueCount',
          'timeSaved',
          'lastReset',
          'theme',
          'testMode',
        ]);

        const debugInfo = {
          extension: 'AutoContinue',
          version: chrome.runtime.getManifest().version,
          timestamp: new Date().toISOString(),
          settings: result,
          userAgent: navigator.userAgent,
        };

        await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
        this.copyDebugLogsBtn.textContent = 'Copied!';
        setTimeout(() => {
          this.copyDebugLogsBtn.textContent = 'Copy Debug Logs';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy debug logs:', error);
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
            await chrome.tabs.sendMessage(tab.id, { action: 'testNativePopup' });
            console.log(
              '[AutoContinue Popup] Message sent successfully to content script - native test popup should appear'
            );
          } catch (messageError) {
            console.log(
              '[AutoContinue Popup] Failed to send message to content script:',
              messageError
            );
            console.log('[AutoContinue Popup] Trying to inject content script manually...');

            try {
              if (
                tab.id &&
                tab.url &&
                (tab.url.includes('youtube.com') || tab.url.includes('music.youtube.com'))
              ) {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['js/content.js'],
                });
                console.log('[AutoContinue Popup] Content script injected manually');
              } else {
                throw new Error('Invalid tab or non-YouTube page');
              }

              setTimeout(async () => {
                try {
                  if (tab.id) {
                    await chrome.tabs.sendMessage(tab.id, { action: 'testNativePopup' });
                  }
                  console.log(
                    '[AutoContinue Popup] Message sent successfully after manual injection - native test popup should appear'
                  );
                } catch {
                  console.log('[AutoContinue Popup] Still failed after manual injection');
                }
              }, 500);
            } catch (injectError) {
              console.log(
                '[AutoContinue Popup] Failed to inject content script manually:',
                injectError
              );
              console.log('[AutoContinue Popup] Using fallback test popup in extension popup');
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
      } finally {
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

document.addEventListener('DOMContentLoaded', () => {
  console.log('[AutoContinue Popup] DOM loaded, initializing popup controller...');
  try {
    new PopupController();
    console.log('[AutoContinue Popup] Popup controller initialized successfully');
  } catch (error) {
    console.error('[AutoContinue Popup] Failed to initialize popup controller:', error);
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
  }
}
