/**
 * AutoContinue Background Script
 *
 * Handles extension lifecycle, storage management, and communication
 */

// Extension installation and updates
chrome.runtime.onInstalled.addListener(details => {
  console.log('[AutoContinue] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      enabled: true,
      showNotifications: false,
      autoContinueCount: 0,
      timeSaved: 0,
      lastReset: Date.now(),
    });

    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[AutoContinue] Message received:', message);

  switch (message.action) {
    case 'toggle':
      handleToggleMessage(message.enabled);
      break;
    case 'updateStats':
      handleStatsUpdate(message.stats);
      break;
    case 'getSettings':
      handleGetSettings(sendResponse);
      return true; // Keep message channel open for async response
    default:
      console.warn('[AutoContinue] Unknown message action:', message.action);
  }
});

// Handle enable/disable toggle
async function handleToggleMessage(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ enabled });
    console.log('[AutoContinue] Extension', enabled ? 'enabled' : 'disabled');
  } catch (error) {
    console.error('[AutoContinue] Failed to update enabled state:', error);
  }
}

// Handle statistics updates
async function handleStatsUpdate(stats: {
  autoContinueCount: number;
  timeSaved: number;
}): Promise<void> {
  try {
    await chrome.storage.local.set({
      autoContinueCount: stats.autoContinueCount,
      timeSaved: stats.timeSaved,
      lastReset: Date.now(),
    });
    console.log('[AutoContinue] Statistics updated:', stats);
  } catch (error) {
    console.error('[AutoContinue] Failed to update statistics:', error);
  }
}

// Handle settings retrieval
async function handleGetSettings(sendResponse: (response: any) => void): Promise<void> {
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

// Handle tab updates to inject content script on YouTube pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isYouTube = tab.url.includes('youtube.com') || tab.url.includes('music.youtube.com');

    if (isYouTube) {
      // Content script will be injected automatically via manifest
      console.log('[AutoContinue] YouTube page loaded:', tab.url);
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(tab => {
  // This will open the popup automatically due to manifest configuration
  console.log('[AutoContinue] Extension icon clicked');
});

// Periodic cleanup (run once per day)
chrome.alarms.create('dailyCleanup', { periodInMinutes: 24 * 60 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'dailyCleanup') {
    performDailyCleanup();
  }
});

async function performDailyCleanup(): Promise<void> {
  try {
    // Clean up old data if needed
    const result = await chrome.storage.local.get(['lastCleanup']);
    const lastCleanup = result.lastCleanup || 0;
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (now - lastCleanup > oneWeek) {
      // Perform cleanup tasks here if needed
      await chrome.storage.local.set({ lastCleanup: now });
      console.log('[AutoContinue] Daily cleanup completed');
    }
  } catch (error) {
    console.error('[AutoContinue] Daily cleanup failed:', error);
  }
}
