import { DEFAULT_CONFIG } from './constants/defaults';

export interface AutoContinueConfig {
  enabled: boolean;
  showNotifications: boolean;
  autoContinueCount: number;
  timeSaved: number;
  lastReset: number;
  idleTimeout: number;
  autoClickDelay: number;
  enableYouTubeMusic: boolean;
  testMode: boolean;
  [key: string]: any;
}

export interface AutoContinueLocalStorage {
  [key: string]: any;
}

export type StorageChangesObject = { [key: string]: chrome.storage.StorageChange };

export class AutoContinueConfigManager {
  private configLocalListeners: Array<(changes: StorageChangesObject) => unknown> = [];

  private syncDefaults: AutoContinueConfig = { ...DEFAULT_CONFIG };

  private localDefaults: AutoContinueLocalStorage = {};

  private cachedConfig: AutoContinueConfig | null = null;
  private cachedLocalStorage: AutoContinueLocalStorage | null = null;
  private config: AutoContinueConfig | null = null;
  private local: AutoContinueLocalStorage | null = null;

  constructor() {
    void this.setupConfig().then(result => {
      this.config = result?.sync || null;
      this.local = result?.local || null;
    });
  }

  private async setupConfig(): Promise<{
    sync: AutoContinueConfig;
    local: AutoContinueLocalStorage;
  } | null> {
    if (typeof chrome === 'undefined') return null;

    await this.fetchConfig();
    this.addDefaults();
    const result = this.configProxy();

    return result;
  }

  private async fetchConfig(): Promise<void> {
    await Promise.all([
      new Promise<void>(resolve => {
        chrome.storage.local.get(null, items => {
          this.cachedConfig = <AutoContinueConfig>(<unknown>(items ?? {}));
          resolve();
        });
      }),
      new Promise<void>(resolve => {
        chrome.storage.local.get(null, items => {
          this.cachedLocalStorage = <AutoContinueLocalStorage>(<unknown>(items ?? {}));
          resolve();
        });
      }),
    ]);
  }

  private addDefaults(): void {
    for (const key in this.syncDefaults) {
      if (!Object.prototype.hasOwnProperty.call(this.cachedConfig, key)) {
        this.cachedConfig![key] = this.syncDefaults[key];
      }
    }

    for (const key in this.localDefaults) {
      if (!Object.prototype.hasOwnProperty.call(this.cachedLocalStorage, key)) {
        this.cachedLocalStorage![key] = this.localDefaults[key];
      }
    }
  }

  private configProxy(): { sync: AutoContinueConfig; local: AutoContinueLocalStorage } {
    chrome.storage.onChanged.addListener(
      (changes: { [key: string]: chrome.storage.StorageChange }, areaName) => {
        try {
          if (areaName === 'local') {
            for (const key in changes) {
              if (
                this.cachedConfig &&
                key in this.cachedConfig &&
                changes[key]?.newValue !== undefined
              ) {
                this.cachedConfig[key] = changes[key].newValue;
              }
              if (
                this.cachedLocalStorage &&
                key in this.cachedLocalStorage &&
                changes[key]?.newValue !== undefined
              ) {
                this.cachedLocalStorage[key] = changes[key].newValue;
              }
            }

            for (const callback of this.configLocalListeners) {
              try {
                callback(changes);
              } catch (error) {
                console.error('[AutoContinue] Error in config listener:', error);
              }
            }
          }
        } catch (error) {
          console.error('[AutoContinue] Error in storage change listener:', error);
        }
      }
    );

    let lastSet = 0;
    const nextToUpdate: Set<string> = new Set();
    let activeTimeout: number | null = null;

    const self = this;
    const configHandler: ProxyHandler<AutoContinueConfig> = {
      set(_target: AutoContinueConfig, prop: string | symbol, value: any) {
        if (typeof prop === 'string') {
          self.cachedConfig![prop] = value;

          if (Date.now() - lastSet < 100) {
            nextToUpdate.add(prop);
            if (!activeTimeout) {
              const delayUpdate = () => {
                const items = [...nextToUpdate];
                nextToUpdate.clear();

                const updateObject: any = {};
                items.forEach(key => {
                  updateObject[key] = self.cachedConfig![key];
                });

                void chrome.storage.local.set(updateObject);
                activeTimeout = null;
              };

              activeTimeout = setTimeout(delayUpdate, 20) as any;
            }
            return true;
          }

          void chrome.storage.local.set({
            [prop]: value,
          });

          lastSet = Date.now();
        }
        return true;
      },

      get(target: AutoContinueConfig, prop: string | symbol) {
        if (typeof prop === 'string') {
          const data = self.cachedConfig![prop];
          return target[prop] || data;
        }
        return (target as any)[prop];
      },

      deleteProperty(_target: AutoContinueConfig, prop: string | symbol) {
        if (typeof prop === 'string') {
          void chrome.storage.local.remove(prop);
        }
        return true;
      },
    };

    const localHandler: ProxyHandler<AutoContinueLocalStorage> = {
      set(_target: AutoContinueLocalStorage, prop: string | symbol, value: any) {
        if (typeof prop === 'string') {
          self.cachedLocalStorage![prop] = value;
          void chrome.storage.local.set({
            [prop]: value,
          });
        }
        return true;
      },

      get(target: AutoContinueLocalStorage, prop: string | symbol) {
        if (typeof prop === 'string') {
          const data = self.cachedLocalStorage![prop];
          return target[prop] || data;
        }
        return (target as any)[prop];
      },

      deleteProperty(_target: AutoContinueLocalStorage, prop: string | symbol) {
        if (typeof prop === 'string') {
          void chrome.storage.local.remove(prop);
        }
        return true;
      },
    };

    return {
      sync: new Proxy<AutoContinueConfig>(
        { handler: configHandler } as unknown as AutoContinueConfig,
        configHandler
      ),
      local: new Proxy<AutoContinueLocalStorage>(
        { handler: localHandler } as unknown as AutoContinueLocalStorage,
        localHandler
      ),
    };
  }

  addConfigListener(callback: (changes: StorageChangesObject) => unknown): void {
    this.configLocalListeners.push(callback);
  }

  removeConfigListener(callback: (changes: StorageChangesObject) => unknown): void {
    const index = this.configLocalListeners.indexOf(callback);
    if (index > -1) {
      this.configLocalListeners.splice(index, 1);
    }
  }

  isReady(): boolean {
    return this.config !== null;
  }

  async waitForReady(): Promise<void> {
    return new Promise(resolve => {
      if (this.isReady()) {
        resolve();
        return;
      }

      const checkReady = () => {
        if (this.isReady()) {
          resolve();
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    });
  }

  getConfig(): AutoContinueConfig | null {
    return this.config;
  }

  getLocal(): AutoContinueLocalStorage | null {
    return this.local;
  }
}

const Config = new AutoContinueConfigManager();
export default Config;
