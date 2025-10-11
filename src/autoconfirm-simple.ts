console.log('[AutoContinue] Simple autoconfirm script loaded');

let lastInteractionTime = Date.now();
let isIdle = false;
const isEnabled = true;

function isUserIdle(): boolean {
  return Date.now() - lastInteractionTime > 5000;
}

function processInteraction(): void {
  lastInteractionTime = Date.now();
  isIdle = false;
}

function autoClickContinue(): boolean {
  const selectors = [
    'button[aria-label*="Continue"]',
    'button[aria-label*="continue"]',
    'button[aria-label*="Resume"]',
    'button[aria-label*="resume"]',
    'yt-button-renderer button',
    '#confirm-button',
    'yt-confirm-dialog-renderer button',
    'ytmusic-you-there-renderer button',
    '[role="button"][aria-label*="Continue"]',
    '[role="button"][aria-label*="continue"]',
  ];

  for (const selector of selectors) {
    const button = document.querySelector(selector) as HTMLButtonElement;
    if (button && button.offsetParent !== null && !button.disabled) {
      console.log('[AutoContinue] Auto-clicking continue button');
      button.click();
      return true;
    }
  }

  console.log('[AutoContinue] Continue button not found');
  return false;
}

function listenForPopupEvent(): void {
  document.addEventListener('yt-popup-opened', (event: any) => {
    const detail = event.detail;
    if (
      detail &&
      (detail.nodeName === 'YT-CONFIRM-DIALOG-RENDERER' ||
        detail.nodeName === 'YTMUSIC-YOU-THERE-RENDERER')
    ) {
      console.log('[AutoContinue] Continue watching popup detected');

      if (isEnabled && isUserIdle()) {
        setTimeout(() => {
          autoClickContinue();
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
                setTimeout(() => {
                  autoClickContinue();
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

function init(): void {
  console.log('[AutoContinue] Initializing simple version');

  setupInteractionListeners();
  listenForPopupEvent();
  setupMutationObserver();

  console.log('[AutoContinue] Simple version initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
