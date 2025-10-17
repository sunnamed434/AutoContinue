import { DEFAULT_CONFIG } from './constants/defaults';
import { logger } from './utils/logger';

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
        })
        .then(() => {
          logger.log('[AutoContinue] Default settings initialized');
        })
        .catch(error => {
          logger.error('[AutoContinue] Failed to initialize default settings:', error);
        });

      chrome.runtime.openOptionsPage().catch(error => {
        logger.error('[AutoContinue] Failed to open options page:', error);
      });
    }
  } catch (error) {
    logger.error('[AutoContinue] Error in onInstalled listener:', error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse): boolean => {
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
      case 'checkVideo':
        // Forward to content script
        return true;
      default:
        logger.warn('[AutoContinue] Unknown message action:', message.action);
    }
    return true;
  } catch (error) {
    logger.error('[AutoContinue] Error handling message:', error);
    return false;
  }
});

async function handleToggleMessage(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ enabled });
  } catch (error) {
    logger.error('[AutoContinue] Failed to update enabled state:', error);
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

      logger.log('[AutoContinue] Local statistics updated:', {
        count: newCount,
        timeSaved: newTimeSaved,
      });
      return;
    } catch (error) {
      retryCount++;
      logger.error(
        `[AutoContinue] Failed to update local statistics (attempt ${retryCount}/${maxRetries}):`,
        error
      );

      if (retryCount >= maxRetries) {
        logger.error('[AutoContinue] Max retries reached for stats update, giving up');
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
    logger.error('[AutoContinue] Failed to get settings:', error);
    sendResponse({});
  }
}

self.addEventListener('error', event => {
  logger.error('[AutoContinue] Global error in background script:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  logger.error('[AutoContinue] Unhandled promise rejection in background script:', event.reason);
});

logger.log('[AutoContinue] Background script loaded successfully');
