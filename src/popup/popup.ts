import { formatTime } from '../utils/formatters';
import { logger } from '../utils/logger';

interface AutoContinueStats {
  enabled: boolean;
  autoContinueCount: number;
  timeSaved: number;
  lastReset: number;
  theme: 'light' | 'dark';
}

class PopupController {
  private enabledToggle!: HTMLInputElement;
  private statusText!: HTMLElement;
  private continueCount!: HTMLElement;
  private timeSaved!: HTMLElement;
  private openOptionsBtn!: HTMLButtonElement;
  private themeToggle!: HTMLInputElement;
  private videoStatus!: HTMLElement;
  private refreshTabBtn!: HTMLButtonElement;

  constructor() {
    try {
      this.initializeElements();
      this.loadSettings().catch(error => {
        logger.error('[AutoContinue Popup] Failed to load settings:', error);
      });
      this.setupEventListeners();
      this.setupSystemThemeListener();
      this.setupStorageListener();
    } catch (error) {
      logger.error('[AutoContinue Popup] Error in PopupController constructor:', error);
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
      logger.error('[AutoContinue Popup] Failed to setup fallback UI:', error);
    }
  }

  private initializeElements(): void {
    this.enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
    this.statusText = document.getElementById('status-text') as HTMLElement;
    this.continueCount = document.getElementById('continue-count') as HTMLElement;
    this.timeSaved = document.getElementById('time-saved') as HTMLElement;
    this.openOptionsBtn = document.getElementById('open-options') as HTMLButtonElement;
    this.themeToggle = document.getElementById('theme-toggle') as HTMLInputElement;
    this.videoStatus = document.getElementById('video-status') as HTMLElement;
    this.refreshTabBtn = document.getElementById('refresh-tab') as HTMLButtonElement;
  }

  private async loadSettings(): Promise<void> {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        logger.warn('[AutoContinue Popup] Chrome storage API not available');
        return;
      }

      const config = await chrome.storage.local.get([
        'enabled',
        'autoContinueCount',
        'timeSaved',
        'lastReset',
        'theme',
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
        theme: config.theme || systemTheme,
      };

      this.updateUI(stats);
      setTimeout(() => this.checkVideoStatus(), 1000);
    } catch (error) {
      logger.error('Failed to load settings:', error);
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
        if (!chrome || !chrome.storage || !chrome.storage.local) return;
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
    if (!chrome || !chrome.storage || !chrome.storage.onChanged) return;
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        try {
          if (changes.enabled) {
            this.enabledToggle.checked = changes.enabled.newValue;
            this.updateStatusText(changes.enabled.newValue);
          }
          if (changes.autoContinueCount) {
            this.continueCount.textContent = `${changes.autoContinueCount.newValue} times`;
          }
          if (changes.timeSaved) {
            this.timeSaved.textContent = formatTime(changes.timeSaved.newValue);
          }
          if (changes.theme) {
            this.themeToggle.checked = changes.theme.newValue === 'dark';
            this.applyTheme(changes.theme.newValue);
          }
        } catch (error) {
          logger.error('[AutoContinue Popup] Error updating stats from storage changes:', error);
        }
      }
    });
  }

  private updateUI(stats: AutoContinueStats): void {
    this.enabledToggle.checked = stats.enabled;
    this.updateStatusText(stats.enabled);
    this.continueCount.textContent = `${stats.autoContinueCount} times`;
    this.timeSaved.textContent = formatTime(stats.timeSaved);
    this.themeToggle.checked = stats.theme === 'dark';
    this.applyTheme(stats.theme);

    const manifest = chrome?.runtime?.getManifest?.() || { version: 'unknown' };
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
      if (!chrome || !chrome.tabs || !chrome.tabs.query) return;
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
              if (chrome.scripting && chrome.scripting.executeScript) {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['js/content.js'],
                });
                logger.log('[AutoContinue] Content script injected manually');
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                logger.log('[AutoContinue] Scripting API not available');
              }
            } catch (injectError) {
              logger.log('[AutoContinue] Could not inject content script:', injectError);
            }
          }

          const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkVideo' });
          logger.log('[AutoContinue] Video status response:', response);

          if (response && response.hasVideo) {
            this.videoStatus.style.display = 'none';
          } else {
            this.videoStatus.style.display = 'block';

            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 3000);
              setTimeout(() => this.checkVideoStatus(retryCount + 1), delay);
            } else {
              logger.log('[AutoContinue] Max retries reached for video detection');
            }
          }
        } catch (error) {
          logger.error('[AutoContinue] Error checking video status:', error);

          if (
            error instanceof Error &&
            error.message &&
            error.message.includes('Could not establish connection')
          ) {
            logger.log('[AutoContinue] Content script not ready, will retry...');
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
      logger.error('Failed to check video status:', error);
    }
  }

  private setupEventListeners(): void {
    this.enabledToggle.addEventListener('change', async () => {
      const enabled = this.enabledToggle.checked;

      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      const config = await chrome.storage.local.get([
        'enabled',
        'autoContinueCount',
        'timeSaved',
        'lastReset',
        'theme',
      ]);
      if (config) {
        config.enabled = enabled;
        await chrome.storage.local.set(config);
      }

      this.updateStatusText(enabled);

      try {
        if (!chrome || !chrome.tabs || !chrome.tabs.query) return;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && tab.url && chrome.tabs.sendMessage) {
          if (tab.url.includes('youtube.com') || tab.url.includes('music.youtube.com')) {
            chrome.tabs.sendMessage(tab.id, { action: 'toggle', enabled });
          }
        }
      } catch (error) {
        logger.error('Failed to notify content script:', error);
      }
    });

    this.themeToggle.addEventListener('change', async () => {
      const theme = this.themeToggle.checked ? 'dark' : 'light';
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      await chrome.storage.local.set({ theme });
      this.applyTheme(theme);
    });

    this.refreshTabBtn.addEventListener('click', async () => {
      try {
        if (!chrome || !chrome.tabs || !chrome.tabs.query) return;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && chrome.tabs.reload) {
          await chrome.tabs.reload(tab.id);
          window.close();
        }
      } catch (error) {
        logger.error('Failed to refresh tab:', error);
      }
    });

    this.openOptionsBtn.addEventListener('click', () => {
      if (chrome?.runtime?.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  logger.log('[AutoContinue Popup] DOM loaded, initializing popup controller...');
  try {
    new PopupController();
    logger.log('[AutoContinue Popup] Popup controller initialized successfully');
  } catch (error) {
    logger.error('[AutoContinue Popup] Failed to initialize popup controller:', error);
  }
});

if (document.readyState === 'loading') {
  logger.log('[AutoContinue Popup] DOM is still loading, waiting for DOMContentLoaded...');
} else {
  logger.log('[AutoContinue Popup] DOM already ready, initializing immediately...');
  try {
    new PopupController();
    logger.log('[AutoContinue Popup] Popup controller initialized successfully (immediate)');
  } catch (error) {
    logger.error('[AutoContinue Popup] Failed to initialize popup controller (immediate):', error);
  }
}
