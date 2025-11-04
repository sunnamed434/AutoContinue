import { logger } from './utils/logger';

let lastInteractionTime = Date.now();
let isEnabled = true;
let idleTimeout = 3000;
let pollInterval: number | null = null;
let lastPopupDetectionTime = 0;
let isInitialized = false;
let mutationObserver: MutationObserver | null = null;
let popupEventListeners: Array<() => void> = [];
let interactionEventListeners: Array<() => void> = [];
let storageEventListener: (() => void) | null = null;
let lastAutoClickTime = 0;
const AUTO_CLICK_DEBOUNCE_MS = 1000;

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
      idleTimeout = 3000;
      return;
    }

    const result = await chrome.storage.local.get(['enabled', 'idleTimeout']);
    isEnabled = result.enabled !== false;
    idleTimeout = (result.idleTimeout || 3) * 1000;
    logger.log('[AutoContinue] Settings loaded:', { isEnabled, idleTimeout });
  } catch (error) {
    logger.error('[AutoContinue] Failed to load settings:', error);
    isEnabled = true;
    idleTimeout = 3000;
  }
}

function setupStorageListener(): void {
  try {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      const settings = customEvent.detail;
      if (settings) {
        if (settings.enabled !== undefined) {
          isEnabled = Boolean(settings.enabled);
          logger.log('[AutoContinue] Extension enabled state changed:', isEnabled);
        }
        if (settings.idleTimeout !== undefined) {
          idleTimeout = (Number(settings.idleTimeout) || 3) * 1000;
          logger.log('[AutoContinue] Idle timeout changed:', idleTimeout);
        }
      }
    };
    window.addEventListener('autocontinue-settings-updated', handler);
    storageEventListener = () =>
      window.removeEventListener('autocontinue-settings-updated', handler);
  } catch (error) {
    logger.error('[AutoContinue] Failed to setup storage listener:', error);
  }
}

async function updateLocalStats(): Promise<void> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        logger.warn('[AutoContinue] Chrome runtime API not available');
        return;
      }

      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'updateStats' }, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      logger.log('[AutoContinue] Local stats update message sent successfully');
      return;
    } catch (error) {
      retryCount++;
      logger.error(
        `[AutoContinue] Failed to send local stats update message (attempt ${retryCount}/${maxRetries}):`,
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

function isPopupVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  if (element.hasAttribute('hidden')) {
    return false;
  }
  return element.offsetParent !== null;
}

export async function autoClickContinue(): Promise<boolean> {
  try {
    const now = Date.now();
    if (now - lastAutoClickTime < AUTO_CLICK_DEBOUNCE_MS) {
      logger.log('[AutoContinue] Debouncing auto-click, too soon since last attempt');
      return false;
    }

    if (!chrome || !chrome.storage || !chrome.storage.local) {
      logger.warn('[AutoContinue] Chrome storage API not available');
      return false;
    }

    const result = await chrome.storage.local.get(['autoContinueInProgress']);
    if (result.autoContinueInProgress) {
      logger.log('[AutoContinue] Auto-continue already in progress, skipping');
      return false;
    }

    const popup = document.querySelector('yt-confirm-dialog-renderer, ytmusic-you-there-renderer');
    if (!popup || !isPopupVisible(popup)) {
      return false;
    }

    lastAutoClickTime = now;

    logger.log('[AutoContinue] Attempting to dismiss popup');

    const isYoutubeMusic = window.location.hostname === 'music.youtube.com';
    const popupContainer = isYoutubeMusic ? 'ytmusic-popup-container' : 'ytd-popup-container';
    const container = document.querySelector(popupContainer) as HTMLElement;

    if (!container) {
      logger.log('[AutoContinue] Popup container not found');
      return false;
    }

    if (!isPopupVisible(container)) {
      logger.log('[AutoContinue] Popup container not visible');
      return false;
    }

    await chrome.storage.local.set({ autoContinueInProgress: true });
    logger.log('[AutoContinue] Clicking popup container');

    try {
      container.click();
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video && video.paused) {
          logger.log('[AutoContinue] Resuming video playback');
          await video.play();
        }
      } catch (error) {
        logger.error('[AutoContinue] Failed to resume video:', error);
      }

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
    } catch (error) {
      logger.error('[AutoContinue] Error clicking popup container:', error);
      setTimeout(async () => {
        try {
          await chrome.storage.local.set({ autoContinueInProgress: false });
        } catch (err) {
          logger.error('[AutoContinue] Failed to reset auto-continue flag:', err);
        }
      }, 1000);
      return false;
    }
  } catch (error) {
    logger.error('[AutoContinue] Error in autoClickContinue:', error);
    return false;
  }
}

function listenForPopupEvent(): void {
  try {
    const handler = (event: Event) => {
      try {
        const customEvent = event as CustomEvent<{ nodeName?: string }>;
        const detail = customEvent.detail;
        if (
          detail &&
          (detail.nodeName === 'YT-CONFIRM-DIALOG-RENDERER' ||
            detail.nodeName === 'YTMUSIC-YOU-THERE-RENDERER')
        ) {
          logger.log('[AutoContinue] Continue watching popup detected via yt-popup-opened event');
          lastPopupDetectionTime = Date.now();

          if (isEnabled && isUserIdle()) {
            setTimeout(async () => {
              await autoClickContinue();
            }, 500);
          } else {
            logger.log('[AutoContinue] Skipping click - extension disabled or user not idle');
          }
        }
      } catch (error) {
        logger.error('[AutoContinue] Error handling yt-popup-opened event:', error);
      }
    };
    document.addEventListener('yt-popup-opened', handler);
    popupEventListeners.push(() => document.removeEventListener('yt-popup-opened', handler));
    logger.log('[AutoContinue] Popup event listener setup complete');
  } catch (error) {
    logger.error('[AutoContinue] Failed to setup popup event listener:', error);
  }
}

function setupInteractionListeners(): void {
  const events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'touchstart', 'scroll'];
  events.forEach(event => {
    document.addEventListener(event, processInteraction, { passive: true });
    interactionEventListeners.push(() => document.removeEventListener(event, processInteraction));
  });
}

function setupMutationObserver(): void {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  if (!document.body) {
    logger.warn('[AutoContinue] document.body not available, cannot setup mutation observer');
    return;
  }

  mutationObserver = new MutationObserver(mutations => {
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
              logger.log('[AutoContinue] Popup detected via mutation observer (childList)');
              lastPopupDetectionTime = Date.now();

              if (isEnabled && isUserIdle()) {
                setTimeout(async () => {
                  await autoClickContinue();
                }, 500);
              }
            }
          }
        });
      }

      if (mutation.type === 'attributes') {
        const target = mutation.target as Element;
        if (
          target.matches &&
          (target.matches('yt-confirm-dialog-renderer') ||
            target.matches('ytmusic-you-there-renderer'))
        ) {
          if (
            isPopupVisible(target) &&
            (mutation.attributeName === 'hidden' || mutation.attributeName === 'style')
          ) {
            logger.log(
              '[AutoContinue] Popup visibility changed via mutation observer (attributes)'
            );
            lastPopupDetectionTime = Date.now();

            if (isEnabled && isUserIdle()) {
              setTimeout(async () => {
                await autoClickContinue();
              }, 500);
            }
          }
        }
      }
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'style', 'class'],
  });

  logger.log('[AutoContinue] Mutation observer setup complete');
}

function setupPeriodicPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  pollInterval = window.setInterval(() => {
    if (!isEnabled) {
      return;
    }

    const timeSinceLastDetection = Date.now() - lastPopupDetectionTime;
    if (timeSinceLastDetection < 5000) {
      return;
    }

    const popup = document.querySelector('yt-confirm-dialog-renderer, ytmusic-you-there-renderer');
    if (popup && isPopupVisible(popup)) {
      logger.log('[AutoContinue] Popup detected via periodic polling');
      lastPopupDetectionTime = Date.now();

      if (isUserIdle()) {
        setTimeout(async () => {
          await autoClickContinue();
        }, 500);
      }
    }
  }, 2000);

  logger.log('[AutoContinue] Periodic polling setup complete');
}

function cleanup(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  popupEventListeners.forEach(remove => remove());
  popupEventListeners = [];

  interactionEventListeners.forEach(remove => remove());
  interactionEventListeners = [];

  if (storageEventListener) {
    storageEventListener();
    storageEventListener = null;
  }
}

async function init(): Promise<void> {
  if (isInitialized) {
    logger.log('[AutoContinue] Already initialized, skipping');
    return;
  }

  logger.log('[AutoContinue] Initializing AutoContinue extension');

  await loadSettings();

  setupInteractionListeners();
  listenForPopupEvent();
  setupMutationObserver();
  setupStorageListener();
  setupPeriodicPolling();

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('unload', cleanup);

  isInitialized = true;
  logger.log('[AutoContinue] Extension initialized successfully');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
