let lastInteractionTime = Date.now();
let isEnabled = true;
let idleTimeout = 5000;

export function isUserIdle(): boolean {
  return Date.now() - lastInteractionTime > idleTimeout;
}

export function processInteraction(): void {
  lastInteractionTime = Date.now();
}

export async function resetAutoContinueFlag(): Promise<void> {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.warn('[AutoContinue] Chrome storage API not available');
      return;
    }

    await chrome.storage.local.set({ autoContinueInProgress: false });
  } catch (error) {
    console.error('[AutoContinue] Failed to reset auto-continue flag:', error);
  }
}

async function loadSettings(): Promise<void> {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.warn('[AutoContinue] Chrome storage API not available');
      isEnabled = true;
      idleTimeout = 5000;
      return;
    }

    const result = await chrome.storage.local.get(['enabled', 'idleTimeout']);
    isEnabled = result.enabled !== false;
    idleTimeout = (result.idleTimeout || 5) * 1000;
    console.log('[AutoContinue] Settings loaded:', { isEnabled, idleTimeout });
  } catch (error) {
    console.error('[AutoContinue] Failed to load settings:', error);
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
          console.log('[AutoContinue] Extension enabled state changed:', isEnabled);
        }
        if (settings.idleTimeout !== undefined) {
          idleTimeout = (Number(settings.idleTimeout) || 5) * 1000;
          console.log('[AutoContinue] Idle timeout changed:', idleTimeout);
        }
      }
    });
  } catch (error) {
    console.error('[AutoContinue] Failed to setup storage listener:', error);
  }
}

async function updateLocalStats(): Promise<void> {
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      console.warn('[AutoContinue] Chrome runtime API not available');
      return;
    }

    chrome.runtime.sendMessage({
      action: 'updateStats',
    });

    console.log('[AutoContinue] Local stats update message sent');
  } catch (error) {
    console.error('[AutoContinue] Failed to send local stats update message:', error);
  }
}

export async function autoClickContinue(): Promise<boolean> {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.warn('[AutoContinue] Chrome storage API not available');
      return false;
    }

    const result = await chrome.storage.local.get(['autoContinueInProgress']);
    if (result.autoContinueInProgress) {
      return false;
    }

    const selectors = [
      'yt-confirm-dialog-renderer yt-button-renderer#confirm-button button',
      'yt-confirm-dialog-renderer button[aria-label*="Continue watching"]',
      'yt-confirm-dialog-renderer button[aria-label*="continue watching"]',
      'yt-confirm-dialog-renderer #confirm-button',
      'yt-confirm-dialog-renderer button[aria-label*="Yes"]',
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
          console.error('[AutoContinue] Failed to update local stats:', error);
        });

        setTimeout(async () => {
          try {
            await chrome.storage.local.set({ autoContinueInProgress: false });
          } catch (error) {
            console.error('[AutoContinue] Failed to reset auto-continue flag:', error);
          }
        }, 1000);

        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[AutoContinue] Error in autoClickContinue:', error);
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
      console.log('[AutoContinue] Continue watching popup detected');

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
              console.log('[AutoContinue] Popup detected via mutation observer');

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
  console.log('[AutoContinue] Initializing simple version');

  await loadSettings();

  setupInteractionListeners();
  listenForPopupEvent();
  setupMutationObserver();
  setupStorageListener();

  console.log('[AutoContinue] Simple version initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
