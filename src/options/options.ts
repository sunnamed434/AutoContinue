import Config from '../config';
import { formatTime, formatDate } from '../utils/formatters';
import { DEFAULT_CONFIG } from '../constants/defaults';

interface AutoContinueSettings {
  enabled: boolean;
  showNotifications: boolean;
  autoContinueCount: number;
  timeSaved: number;
  lastReset: number;
  idleTimeout: number;
  autoClickDelay: number;
  enableYouTubeMusic: boolean;
  testMode: boolean;
}

class OptionsController {
  private enabledToggle: HTMLInputElement;
  private showNotificationsToggle: HTMLInputElement;
  private idleTimeoutInput: HTMLInputElement;
  private autoClickDelayInput: HTMLInputElement;
  private enableYouTubeMusicToggle: HTMLInputElement;
  private testModeToggle: HTMLInputElement;
  private totalContinues: HTMLElement;
  private totalTimeSaved: HTMLElement;
  private lastReset: HTMLElement;
  private resetStatsBtn: HTMLButtonElement;
  private exportStatsBtn: HTMLButtonElement;
  private resetDefaultsBtn: HTMLButtonElement;
  private versionElement: HTMLElement;

  constructor() {
    this.initializeElements();
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      await Config.waitForReady();
      this.loadSettings();
      this.setupEventListeners();
      this.setupConfigListener();
    } catch (error) {
      console.error('[AutoContinue] Failed to initialize config:', error);
      this.loadSettings();
      this.setupEventListeners();
    }
  }

  private setupConfigListener(): void {
    Config.addConfigListener(() => {
      this.loadSettings();
    });
  }

  private initializeElements(): void {
    this.enabledToggle = document.getElementById('enabled') as HTMLInputElement;
    this.showNotificationsToggle = document.getElementById(
      'show-notifications'
    ) as HTMLInputElement;
    this.idleTimeoutInput = document.getElementById('idle-timeout') as HTMLInputElement;
    this.autoClickDelayInput = document.getElementById('auto-click-delay') as HTMLInputElement;
    this.enableYouTubeMusicToggle = document.getElementById(
      'enable-youtube-music'
    ) as HTMLInputElement;
    this.testModeToggle = document.getElementById('test-mode') as HTMLInputElement;
    this.totalContinues = document.getElementById('total-continues') as HTMLElement;
    this.totalTimeSaved = document.getElementById('total-time-saved') as HTMLElement;
    this.lastReset = document.getElementById('last-reset') as HTMLElement;
    this.resetStatsBtn = document.getElementById('reset-stats') as HTMLButtonElement;
    this.exportStatsBtn = document.getElementById('export-stats') as HTMLButtonElement;
    this.resetDefaultsBtn = document.getElementById('reset-defaults') as HTMLButtonElement;
    this.versionElement = document.getElementById('version') as HTMLElement;
  }

  private loadSettings(): void {
    try {
      const config = Config.getConfig();
      if (!config) {
        return;
      }

      const settings: AutoContinueSettings = {
        enabled: config.enabled,
        showNotifications: config.showNotifications,
        autoContinueCount: config.autoContinueCount,
        timeSaved: config.timeSaved,
        lastReset: config.lastReset,
        idleTimeout: config.idleTimeout,
        autoClickDelay: config.autoClickDelay,
        enableYouTubeMusic: config.enableYouTubeMusic,
        testMode: config.testMode,
      };

      this.updateUI(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private updateUI(settings: AutoContinueSettings): void {
    this.enabledToggle.checked = settings.enabled;
    this.showNotificationsToggle.checked = settings.showNotifications;
    this.idleTimeoutInput.value = settings.idleTimeout.toString();
    this.autoClickDelayInput.value = settings.autoClickDelay.toString();
    this.enableYouTubeMusicToggle.checked = settings.enableYouTubeMusic;
    this.testModeToggle.checked = settings.testMode;

    this.totalContinues.textContent = settings.autoContinueCount.toString();
    this.totalTimeSaved.textContent = formatTime(settings.timeSaved);
    this.lastReset.textContent = formatDate(settings.lastReset);

    const manifest = chrome.runtime.getManifest();
    this.versionElement.textContent = manifest.version;
  }

  private setupEventListeners(): void {
    this.enabledToggle.addEventListener('change', () => {
      const config = Config.getConfig();
      if (config) {
        config.enabled = this.enabledToggle.checked;
      }
    });

    this.showNotificationsToggle.addEventListener('change', () => {
      const config = Config.getConfig();
      if (config) {
        config.showNotifications = this.showNotificationsToggle.checked;
      }
    });

    this.idleTimeoutInput.addEventListener('change', () => {
      const value = Math.max(1, Math.min(60, parseInt(this.idleTimeoutInput.value) || 5));
      this.idleTimeoutInput.value = value.toString();
      const config = Config.getConfig();
      if (config) {
        config.idleTimeout = value;
      }
    });

    this.autoClickDelayInput.addEventListener('change', () => {
      const value = Math.max(0, Math.min(5000, parseInt(this.autoClickDelayInput.value) || 100));
      this.autoClickDelayInput.value = value.toString();
      const config = Config.getConfig();
      if (config) {
        config.autoClickDelay = value;
      }
    });

    this.enableYouTubeMusicToggle.addEventListener('change', () => {
      const config = Config.getConfig();
      if (config) {
        config.enableYouTubeMusic = this.enableYouTubeMusicToggle.checked;
      }
    });

    this.testModeToggle.addEventListener('change', () => {
      const config = Config.getConfig();
      if (config) {
        config.testMode = this.testModeToggle.checked;
      }
    });

    this.resetStatsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
        const config = Config.getConfig();
        if (config) {
          config.autoContinueCount = 0;
          config.timeSaved = 0;
          config.lastReset = Date.now();
          this.loadSettings();
        }
      }
    });

    this.resetDefaultsBtn.addEventListener('click', () => {
      if (
        confirm(
          'Are you sure you want to reset ALL settings to defaults? This will reset all your preferences and statistics and cannot be undone.'
        )
      ) {
        const config = Config.getConfig();
        if (config) {
          config.enabled = DEFAULT_CONFIG.enabled;
          config.showNotifications = DEFAULT_CONFIG.showNotifications;
          config.autoContinueCount = DEFAULT_CONFIG.autoContinueCount;
          config.timeSaved = DEFAULT_CONFIG.timeSaved;
          config.lastReset = DEFAULT_CONFIG.lastReset;
          config.idleTimeout = DEFAULT_CONFIG.idleTimeout;
          config.autoClickDelay = DEFAULT_CONFIG.autoClickDelay;
          config.enableYouTubeMusic = DEFAULT_CONFIG.enableYouTubeMusic;
          config.testMode = DEFAULT_CONFIG.testMode;
          this.loadSettings();
        }
      }
    });

    this.exportStatsBtn.addEventListener('click', () => {
      try {
        const config = Config.getConfig();
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
        console.error('Failed to export settings:', error);
        alert('Failed to export settings. Please try again.');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
