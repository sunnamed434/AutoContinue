import { formatTime, formatDate } from '../utils/formatters';
import { DEFAULT_CONFIG } from '../constants/defaults';
import { logger } from '../utils/logger';

interface AutoContinueSettings {
  enabled: boolean;
  autoContinueCount: number;
  timeSaved: number;
  lastReset: number;
  idleTimeout: number;
}

class OptionsController {
  private enabledToggle!: HTMLInputElement;
  private idleTimeoutInput!: HTMLInputElement;
  private totalContinues!: HTMLElement;
  private totalTimeSaved!: HTMLElement;
  private lastReset!: HTMLElement;
  private resetStatsBtn!: HTMLButtonElement;
  private exportStatsBtn!: HTMLButtonElement;
  private resetDefaultsBtn!: HTMLButtonElement;
  private versionElement!: HTMLElement;

  constructor() {
    this.initializeElements();
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      this.loadSettings();
      this.setupEventListeners();
      this.setupConfigListener();
    } catch (error) {
      logger.error('[AutoContinue] Failed to initialize config:', error);
      this.loadSettings();
      this.setupEventListeners();
    }
  }

  private setupConfigListener(): void {
    if (!chrome || !chrome.storage || !chrome.storage.onChanged) return;
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        try {
          if (changes.enabled) {
            this.enabledToggle.checked = changes.enabled.newValue;
          }
          if (changes.idleTimeout) {
            this.idleTimeoutInput.value = changes.idleTimeout.newValue.toString();
          }
        } catch (error) {
          logger.error('[AutoContinue Options] Error updating UI from storage changes:', error);
        }
      }
    });
  }

  private initializeElements(): void {
    this.enabledToggle = document.getElementById('enabled') as HTMLInputElement;
    this.idleTimeoutInput = document.getElementById('idle-timeout') as HTMLInputElement;
    this.totalContinues = document.getElementById('total-continues') as HTMLElement;
    this.totalTimeSaved = document.getElementById('total-time-saved') as HTMLElement;
    this.lastReset = document.getElementById('last-reset') as HTMLElement;
    this.resetStatsBtn = document.getElementById('reset-stats') as HTMLButtonElement;
    this.exportStatsBtn = document.getElementById('export-stats') as HTMLButtonElement;
    this.resetDefaultsBtn = document.getElementById('reset-defaults') as HTMLButtonElement;
    this.versionElement = document.getElementById('version') as HTMLElement;
  }

  private async loadSettings(): Promise<void> {
    try {
      const config = await chrome.storage.local.get();
      if (!config) {
        return;
      }

      const settings: AutoContinueSettings = {
        enabled: config.enabled,
        autoContinueCount: config.autoContinueCount,
        timeSaved: config.timeSaved,
        lastReset: config.lastReset,
        idleTimeout: config.idleTimeout,
      };

      this.updateUI(settings);
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  }

  private updateUI(settings: AutoContinueSettings): void {
    this.enabledToggle.checked = settings.enabled;
    this.idleTimeoutInput.value = settings.idleTimeout.toString();

    this.totalContinues.textContent = settings.autoContinueCount.toString();
    this.totalTimeSaved.textContent = formatTime(settings.timeSaved);
    this.lastReset.textContent = formatDate(settings.lastReset);

    const manifest = chrome.runtime.getManifest();
    this.versionElement.textContent = manifest.version;
  }

  private setupEventListeners(): void {
    this.enabledToggle.addEventListener('change', async () => {
      const config = await chrome.storage.local.get();
      if (config) {
        config.enabled = this.enabledToggle.checked;
        await chrome.storage.local.set(config);
      }
    });

    this.idleTimeoutInput.addEventListener('change', async () => {
      const value = Math.max(1, Math.min(60, parseInt(this.idleTimeoutInput.value) || 5));
      this.idleTimeoutInput.value = value.toString();
      const config = await chrome.storage.local.get();
      if (config) {
        config.idleTimeout = value;
        await chrome.storage.local.set(config);
      }
    });

    this.resetStatsBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
        const config = await chrome.storage.local.get();
        if (config) {
          config.autoContinueCount = 0;
          config.timeSaved = 0;
          config.lastReset = Date.now();
          await chrome.storage.local.set(config);
          this.loadSettings();
        }
      }
    });

    this.resetDefaultsBtn.addEventListener('click', async () => {
      if (
        confirm(
          'Are you sure you want to reset ALL settings to defaults? This will reset all your preferences and statistics and cannot be undone.'
        )
      ) {
        const config = await chrome.storage.local.get();
        if (config) {
          config.enabled = DEFAULT_CONFIG.enabled;
          config.autoContinueCount = DEFAULT_CONFIG.autoContinueCount;
          config.timeSaved = DEFAULT_CONFIG.timeSaved;
          config.lastReset = DEFAULT_CONFIG.lastReset;
          config.idleTimeout = DEFAULT_CONFIG.idleTimeout;
          await chrome.storage.local.set(config);
          this.loadSettings();
        }
      }
    });

    this.exportStatsBtn.addEventListener('click', async () => {
      try {
        const config = await chrome.storage.local.get();
        if (!config) {
          return;
        }

        const exportData = {
          ...config,
          exportDate: new Date().toISOString(),
          version: chrome.runtime.getManifest().version,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `autocontinue-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.error('Failed to export settings:', error);
        alert('Failed to export settings. Please try again.');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
