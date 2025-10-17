import { logger } from './utils/logger';

let lastInteractionTime = Date.now();
let isEnabled = true;
let idleTimeout = 5000;

export function isUserIdle(): boolean {
  return Date.now() - lastInteractionTime > idleTimeout;
}

export function processInteraction(): void {
  lastInteractionTime = Date.now();
}

async function loadSettings(): Promise<void> {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      logger.warn('[AutoContinue] Chrome storage API not available');
      isEnabled = true;
      idleTimeout = 5000;
      return;
    }

    const result = await chrome.storage.local.get(['enabled', 'idleTimeout']);
    isEnabled = result.enabled !== false;
    idleTimeout = (result.idleTimeout || 5) * 1000;
    logger.log('[AutoContinue] Settings loaded:', { isEnabled, idleTimeout });
  } catch (error) {
    logger.error('[AutoContinue] Failed to load settings:', error);
    isEnabled = true;
    idleTimeout = 5000;
  }
}

function setupStorageListener(): void {
  try {
    window.addEventListener('autocontinue-settings-updated', (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      const settings = customEvent.detail;
      if (settings) {
        if (settings.enabled !== undefined) {
          isEnabled = Boolean(settings.enabled);
          logger.log('[AutoContinue] Extension enabled state changed:', isEnabled);
        }
        if (settings.idleTimeout !== undefined) {
          idleTimeout = (Number(settings.idleTimeout) || 5) * 1000;
          logger.log('[AutoContinue] Idle timeout changed:', idleTimeout);
        }
      }
    });
  } catch (error) {
    logger.error('[AutoContinue] Failed to setup storage listener:', error);
  }
}

async function updateLocalStats(): Promise<void> {
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      logger.warn('[AutoContinue] Chrome runtime API not available');
      return;
    }

    chrome.runtime.sendMessage({
      action: 'updateStats',
    });

    logger.log('[AutoContinue] Local stats update message sent');
  } catch (error) {
    logger.error('[AutoContinue] Failed to send local stats update message:', error);
  }
}

export async function autoClickContinue(): Promise<boolean> {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      logger.warn('[AutoContinue] Chrome storage API not available');
      return false;
    }

    const result = await chrome.storage.local.get(['autoContinueInProgress']);
    if (result.autoContinueInProgress) {
      return false;
    }

    const selectors = [
      // New selectors with yt-button-shape (YouTube updated DOM structure)
      'yt-confirm-dialog-renderer yt-button-renderer#confirm-button yt-button-shape button',
      'yt-confirm-dialog-renderer yt-button-shape button[aria-label*="Yes"]',
      'yt-confirm-dialog-renderer yt-button-shape button[aria-label*="Continue"]',
      'yt-confirm-dialog-renderer yt-button-shape button[aria-label*="continue"]',
      // Legacy selectors (fallback for older YouTube versions)
      'yt-confirm-dialog-renderer yt-button-renderer#confirm-button button',
      'yt-confirm-dialog-renderer button[aria-label*="Continue watching"]',
      'yt-confirm-dialog-renderer button[aria-label*="continue watching"]',
      'yt-confirm-dialog-renderer #confirm-button',
      'yt-confirm-dialog-renderer button[aria-label*="Yes"]',
      // YouTube Music selectors
      'ytmusic-you-there-renderer yt-button-shape button',
      'ytmusic-you-there-renderer button[aria-label*="Continue"]',
      'ytmusic-you-there-renderer button[aria-label*="continue"]',
      'yt-confirm-dialog-renderer yt-button-renderer button',
      'ytmusic-you-there-renderer yt-button-renderer button',
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLButtonElement;
      if (button && button.offsetParent !== null && !button.disabled) {
        await chrome.storage.local.set({ autoContinueInProgress: true });
        button.click();

        updateLocalStats().catch(error => {
          logger.error('[AutoContinue] Failed to update local stats:', error);
        });

        setTimeout(async () => {
          try {
            await chrome.storage.local.set({ autoContinueInProgress: false });
          } catch (error) {
            logger.error('[AutoContinue] Failed to reset auto-continue flag:', error);
          }
        }, 1000);

        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('[AutoContinue] Error in autoClickContinue:', error);
    return false;
  }
}

function listenForPopupEvent(): void {
  document.addEventListener('yt-popup-opened', (event: Event) => {
    const customEvent = event as CustomEvent<{ nodeName?: string }>;
    const detail = customEvent.detail;
    if (
      detail &&
      (detail.nodeName === 'YT-CONFIRM-DIALOG-RENDERER' ||
        detail.nodeName === 'YTMUSIC-YOU-THERE-RENDERER')
    ) {
      logger.log('[AutoContinue] Continue watching popup detected');

      if (isEnabled && isUserIdle()) {
        setTimeout(async () => {
          await autoClickContinue();
        }, 100);
      }
    }
  });
}

function setupInteractionListeners(): void {
  const events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'touchstart', 'scroll'];
  events.forEach(event => {
    document.addEventListener(event, processInteraction, { passive: true });
  });
}

function setupMutationObserver(): void {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (
              element.matches &&
              (element.matches('yt-confirm-dialog-renderer') ||
                element.matches('ytmusic-you-there-renderer') ||
                element.querySelector('yt-confirm-dialog-renderer') ||
                element.querySelector('ytmusic-you-there-renderer'))
            ) {
              logger.log('[AutoContinue] Popup detected via mutation observer');

              if (isEnabled && isUserIdle()) {
                setTimeout(async () => {
                  await autoClickContinue();
                }, 200);
              }
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

async function init(): Promise<void> {
  logger.log('[AutoContinue] Initializing simple version');

  await loadSettings();

  setupInteractionListeners();
  listenForPopupEvent();
  setupMutationObserver();
  setupStorageListener();

  logger.log('[AutoContinue] Simple version initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
