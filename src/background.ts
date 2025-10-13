import { DEFAULT_CONFIG } from './constants/defaults';

const hiddenYouTubeTabs = new Set<number>();
const monitoringIntervals = new Map<number, number>();

chrome.runtime.onInstalled.addListener(details => {
  try {
    if (details.reason === 'install') {
      chrome.storage.local
        .set({
          enabled: DEFAULT_CONFIG.enabled,
          showNotifications: DEFAULT_CONFIG.showNotifications,
          autoContinueCount: DEFAULT_CONFIG.autoContinueCount,
          timeSaved: DEFAULT_CONFIG.timeSaved,
          lastReset: DEFAULT_CONFIG.lastReset,
          idleTimeout: DEFAULT_CONFIG.idleTimeout,
          autoClickDelay: DEFAULT_CONFIG.autoClickDelay,
          enableYouTubeMusic: DEFAULT_CONFIG.enableYouTubeMusic,
          testMode: DEFAULT_CONFIG.testMode,
        })
        .then(() => {
          console.log('[AutoContinue] Default settings initialized');
        })
        .catch(error => {
          console.error('[AutoContinue] Failed to initialize default settings:', error);
        });

      chrome.runtime.openOptionsPage().catch(error => {
        console.error('[AutoContinue] Failed to open options page:', error);
      });
    }
  } catch (error) {
    console.error('[AutoContinue] Error in onInstalled listener:', error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse): boolean => {
  try {
    switch (message.action) {
      case 'toggle':
        handleToggleMessage(message.enabled);
        break;
      case 'updateStats':
        handleStatsUpdate();
        break;
      case 'getSettings':
        handleGetSettings(sendResponse);
        return true;
      case 'tabHidden':
        handleTabHidden(sender.tab?.id);
        break;
      case 'tabVisible':
        handleTabVisible(sender.tab?.id);
        break;
      default:
        console.warn('[AutoContinue] Unknown message action:', message.action);
    }
    return true;
  } catch (error) {
    console.error('[AutoContinue] Error handling message:', error);
    return false;
  }
});

async function handleToggleMessage(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ enabled });
  } catch (error) {
    console.error('[AutoContinue] Failed to update enabled state:', error);
  }
}

async function handleStatsUpdate(): Promise<void> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const result = await chrome.storage.local.get(['autoContinueCount', 'timeSaved']);
      const currentCount = result['autoContinueCount'] || 0;
      const currentTimeSaved = result['timeSaved'] || 0;

      const newCount = currentCount + 1;
      const newTimeSaved = currentTimeSaved + 30;

      await chrome.storage.local.set({
        autoContinueCount: newCount,
        timeSaved: newTimeSaved,
      });

      console.log('[AutoContinue] Statistics updated atomically:', {
        count: newCount,
        timeSaved: newTimeSaved,
      });
      return;
    } catch (error) {
      retryCount++;
      console.error(
        `[AutoContinue] Failed to update statistics (attempt ${retryCount}/${maxRetries}):`,
        error
      );

      if (retryCount >= maxRetries) {
        console.error('[AutoContinue] Max retries reached for stats update, giving up');
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function handleGetSettings(
  sendResponse: (response: Record<string, unknown>) => void
): Promise<void> {
  try {
    const result = await chrome.storage.local.get([
      'enabled',
      'showNotifications',
      'autoContinueCount',
      'timeSaved',
      'lastReset',
    ]);
    sendResponse(result);
  } catch (error) {
    console.error('[AutoContinue] Failed to get settings:', error);
    sendResponse({});
  }
}

async function handleTabHidden(tabId: number | undefined): Promise<void> {
  if (!tabId) return;

  try {
    const tab = await chrome.tabs.get(tabId);
    const isYouTube = tab.url?.includes('youtube.com') || tab.url?.includes('music.youtube.com');

    if (isYouTube) {
      hiddenYouTubeTabs.add(tabId);
      startMonitoringTab(tabId);
    }
  } catch (error) {
    console.error(`[AutoContinue] Failed to handle tab hidden for tab ${tabId}:`, error);
  }
}

async function handleTabVisible(tabId: number | undefined): Promise<void> {
  if (!tabId) return;

  try {
    hiddenYouTubeTabs.delete(tabId);
    stopMonitoringTab(tabId);
  } catch (error) {
    console.error(`[AutoContinue] Failed to handle tab visible for tab ${tabId}:`, error);
  }
}

function startMonitoringTab(tabId: number): void {
  stopMonitoringTab(tabId);

  const interval = setInterval(async () => {
    if (!hiddenYouTubeTabs.has(tabId)) {
      clearInterval(interval as unknown as number);
      monitoringIntervals.delete(tabId);
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['js/autoconfirm.js'],
      });
    } catch (error) {
      console.error(`[AutoContinue] Failed to inject script into tab ${tabId}:`, error);
      hiddenYouTubeTabs.delete(tabId);
      clearInterval(interval as unknown as number);
      monitoringIntervals.delete(tabId);
    }
  }, 3000) as unknown as number;

  monitoringIntervals.set(tabId, interval);
}

function stopMonitoringTab(tabId: number): void {
  const interval = monitoringIntervals.get(tabId);
  if (interval) {
    clearInterval(interval);
    monitoringIntervals.delete(tabId);
  }
}

chrome.tabs.onRemoved.addListener(tabId => {
  try {
    hiddenYouTubeTabs.delete(tabId);
    stopMonitoringTab(tabId);
  } catch (error) {
    console.error(`[AutoContinue] Error cleaning up tab ${tabId}:`, error);
  }
});

self.addEventListener('error', event => {
  console.error('[AutoContinue] Global error in background script:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[AutoContinue] Unhandled promise rejection in background script:', event.reason);
});

console.log('[AutoContinue] Background script loaded successfully');
