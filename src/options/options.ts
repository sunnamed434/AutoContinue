/**
 * AutoContinue Options Page Script
 * 
 * Handles the options page functionality and settings management
 */

interface AutoContinueSettings {
  enabled: boolean;
  showNotifications: boolean;
  autoContinueCount: number;
  timeSaved: number;
  lastReset: number;
  idleTimeout: number;
  autoClickDelay: number;
  enableYouTubeMusic: boolean;
}

class OptionsController {
  private enabledToggle: HTMLInputElement;
  private showNotificationsToggle: HTMLInputElement;
  private idleTimeoutInput: HTMLInputElement;
  private autoClickDelayInput: HTMLInputElement;
  private enableYouTubeMusicToggle: HTMLInputElement;
  private totalContinues: HTMLElement;
  private totalTimeSaved: HTMLElement;
  private lastReset: HTMLElement;
  private resetStatsBtn: HTMLButtonElement;
  private exportStatsBtn: HTMLButtonElement;
  private versionElement: HTMLElement;

  constructor() {
    this.initializeElements();
    this.loadSettings();
    this.setupEventListeners();
  }

  private initializeElements(): void {
    this.enabledToggle = document.getElementById('enabled') as HTMLInputElement;
    this.showNotificationsToggle = document.getElementById('show-notifications') as HTMLInputElement;
    this.idleTimeoutInput = document.getElementById('idle-timeout') as HTMLInputElement;
    this.autoClickDelayInput = document.getElementById('auto-click-delay') as HTMLInputElement;
    this.enableYouTubeMusicToggle = document.getElementById('enable-youtube-music') as HTMLInputElement;
    this.totalContinues = document.getElementById('total-continues') as HTMLElement;
    this.totalTimeSaved = document.getElementById('total-time-saved') as HTMLElement;
    this.lastReset = document.getElementById('last-reset') as HTMLElement;
    this.resetStatsBtn = document.getElementById('reset-stats') as HTMLButtonElement;
    this.exportStatsBtn = document.getElementById('export-stats') as HTMLButtonElement;
    this.versionElement = document.getElementById('version') as HTMLElement;
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([
        'enabled',
        'showNotifications',
        'autoContinueCount',
        'timeSaved',
        'lastReset',
        'idleTimeout',
        'autoClickDelay',
        'enableYouTubeMusic'
      ]);

      const settings: AutoContinueSettings = {
        enabled: result.enabled !== false,
        showNotifications: result.showNotifications || false,
        autoContinueCount: result.autoContinueCount || 0,
        timeSaved: result.timeSaved || 0,
        lastReset: result.lastReset || Date.now(),
        idleTimeout: result.idleTimeout || 5,
        autoClickDelay: result.autoClickDelay || 100,
        enableYouTubeMusic: result.enableYouTubeMusic !== false
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

    this.totalContinues.textContent = settings.autoContinueCount.toString();
    this.totalTimeSaved.textContent = this.formatTime(settings.timeSaved);
    this.lastReset.textContent = this.formatDate(settings.lastReset);

    const manifest = chrome.runtime.getManifest();
    this.versionElement.textContent = manifest.version;
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

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private setupEventListeners(): void {
    this.enabledToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ enabled: this.enabledToggle.checked });
    });

    this.showNotificationsToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ showNotifications: this.showNotificationsToggle.checked });
    });

    this.idleTimeoutInput.addEventListener('change', async () => {
      const value = Math.max(1, Math.min(60, parseInt(this.idleTimeoutInput.value) || 5));
      this.idleTimeoutInput.value = value.toString();
      await chrome.storage.local.set({ idleTimeout: value });
    });

    this.autoClickDelayInput.addEventListener('change', async () => {
      const value = Math.max(0, Math.min(5000, parseInt(this.autoClickDelayInput.value) || 100));
      this.autoClickDelayInput.value = value.toString();
      await chrome.storage.local.set({ autoClickDelay: value });
    });

    this.enableYouTubeMusicToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ enableYouTubeMusic: this.enableYouTubeMusicToggle.checked });
    });

    // Reset statistics
    this.resetStatsBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
        await chrome.storage.local.set({
          autoContinueCount: 0,
          timeSaved: 0,
          lastReset: Date.now()
        });
        await this.loadSettings();
      }
    });

    // Export statistics
    this.exportStatsBtn.addEventListener('click', async () => {
      try {
        const result = await chrome.storage.local.get([
          'enabled',
          'showNotifications',
          'autoContinueCount',
          'timeSaved',
          'lastReset'
        ]);

        const exportData = {
          ...result,
          exportDate: new Date().toISOString(),
          version: chrome.runtime.getManifest().version
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
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

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
