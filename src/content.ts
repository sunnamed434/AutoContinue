console.log(`[AutoContinue v${chrome.runtime.getManifest().version}] Content script loaded`);
console.log('[AutoContinue] Content script is ready to receive messages');

export function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime && !!chrome.runtime.getURL && !!chrome.runtime.id;
  } catch {
    return false;
  }
}

export function isVideoVisible(video: HTMLVideoElement): boolean {
  if (!video) return false;

  if (video.offsetHeight === 0 || video.offsetWidth === 0) {
    return false;
  }

  const boundingRect = video.getBoundingClientRect();
  const elementAtPoint =
    document.elementFromPoint(
      boundingRect.left + boundingRect.width / 2,
      boundingRect.top + boundingRect.height / 2
    ) || document.elementFromPoint(boundingRect.left, boundingRect.top);

  if (
    elementAtPoint === video ||
    (elementAtPoint && video.contains(elementAtPoint)) ||
    (elementAtPoint && elementAtPoint.contains(video))
  ) {
    return true;
  }

  if (video.tagName === 'VIDEO') {
    return (
      !!elementAtPoint?.closest('.html5-video-player')?.contains(video) ||
      !!video.closest('#inline-preview-player')?.classList?.contains('playing-mode')
    );
  }

  return false;
}

export function checkForVideoElement(): boolean {
  const videos = document.querySelectorAll('video');
  console.log('[AutoContinue] Found', videos.length, 'video elements');

  for (const video of videos) {
    const htmlVideo = video as HTMLVideoElement;

    if (htmlVideo.duration && htmlVideo.duration > 0) {
      console.log('[AutoContinue] Found video with duration:', htmlVideo.duration);

      if (isVideoVisible(htmlVideo)) {
        console.log('[AutoContinue] Video is visible');
        return true;
      }

      if (
        htmlVideo.classList.contains('html5-main-video') ||
        htmlVideo.id === 'player' ||
        htmlVideo.id === 'player_html5_api'
      ) {
        console.log('[AutoContinue] Found main video element');
        return true;
      }
    }
  }

  const playerContainers = [
    '#movie_player',
    '#player',
    'ytd-player',
    'ytd-watch-flexy',
    '#player-container',
    '.html5-video-player',
    'ytd-video-player',
    'ytd-music-player',
  ];

  for (const containerSelector of playerContainers) {
    const container = document.querySelector(containerSelector);
    if (container) {
      const containerVideo = container.querySelector('video') as HTMLVideoElement;
      if (containerVideo && containerVideo.duration && containerVideo.duration > 0) {
        console.log('[AutoContinue] Found video in container:', containerSelector);
        return true;
      }
    }
  }

  const musicPlayer = document.querySelector('ytmusic-player');
  if (musicPlayer) {
    const musicVideo = musicPlayer.querySelector('video') as HTMLVideoElement;
    if (musicVideo && musicVideo.duration && musicVideo.duration > 0) {
      console.log('[AutoContinue] Found video in YouTube Music player');
      return true;
    }
  }

  const allVideos = document.querySelectorAll('video');
  for (const video of allVideos) {
    const htmlVideo = video as HTMLVideoElement;
    if (
      htmlVideo.duration &&
      htmlVideo.duration > 0 &&
      htmlVideo.offsetWidth > 0 &&
      htmlVideo.offsetHeight > 0
    ) {
      console.log('[AutoContinue] Found valid video element as fallback');
      return true;
    }
  }

  return false;
}

let autoconfirmScriptInjected = false;
let cleanupFunctions: (() => void)[] = [];

let lastInteractionTime = Date.now();
let isAutoconfirmEnabled = true;
let idleTimeout = 5000;

function injectAutoconfirmScript(): void {
  try {
    if (!isExtensionContextValid()) {
      console.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
      return;
    }

    if (autoconfirmScriptInjected) {
      return;
    }

    autoconfirmScriptInjected = true;
    console.log('[AutoContinue] Autoconfirm functionality enabled');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
    } else {
      console.error('[AutoContinue] Error enabling autoconfirm functionality:', error);
    }
  }
}

async function initializeExtension(): Promise<void> {
  injectAutoconfirmScript();
  setupAutoconfirmListeners();
  await loadAutoconfirmSettings();

  setTimeout(() => {
    const hasVideo = checkForVideoElement();
    if (hasVideo) {
      console.log('[AutoContinue] Video found after delay');
    } else {
      console.log('[AutoContinue] No video found after delay, checking containers...');
      const containers = document.querySelectorAll(
        'ytd-player, #movie_player, #player, ytd-watch-flexy, ytd-music-player'
      );
      console.log('[AutoContinue] Found containers:', containers.length);
    }
  }, 2000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

let lastUrl = location.href;
let urlObserver: MutationObserver | null = null;

function setupUrlObserver(): void {
  if (urlObserver) {
    urlObserver.disconnect();
  }

  urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      autoconfirmScriptInjected = false;
      setTimeout(injectAutoconfirmScript, 100);
    }
  });

  urlObserver.observe(document, { subtree: true, childList: true });

  cleanupFunctions.push(() => {
    if (urlObserver) {
      urlObserver.disconnect();
      urlObserver = null;
    }
  });
}

setupUrlObserver();

function cleanup(): void {
  console.log('[AutoContinue] Cleaning up resources...');
  cleanupFunctions.forEach(cleanupFn => {
    try {
      cleanupFn();
    } catch (error) {
      console.error('[AutoContinue] Error during cleanup:', error);
    }
  });
  cleanupFunctions = [];
}

window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    const settings: Record<string, unknown> = {};

    if (changes['enabled']) {
      settings.enabled = changes['enabled'].newValue;
    }
    if (changes['idleTimeout']) {
      settings.idleTimeout = changes['idleTimeout'].newValue;
    }
    if (changes['enableYouTubeMusic']) {
      settings.enableYouTubeMusic = changes['enableYouTubeMusic'].newValue;
    }

    if (Object.keys(settings).length > 0) {
      const event = new CustomEvent('autocontinue-settings-updated', {
        detail: settings,
      });
      window.dispatchEvent(event);
      console.log('[AutoContinue] Settings updated and sent to autoconfirm script:', settings);
    }
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (!isExtensionContextValid()) {
      console.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
      return false;
    }

    console.log('[AutoContinue] Message received:', message);

    switch (message.action) {
      case 'checkVideo': {
        const hasVideo = checkForVideoElement();
        console.log('[AutoContinue] Final video check result:', hasVideo);
        sendResponse({ hasVideo });
        return true;
      }
      case 'toggle':
        console.log('[AutoContinue] Extension', message.enabled ? 'enabled' : 'disabled');
        isAutoconfirmEnabled = message.enabled;
        break;
      default:
        console.warn('[AutoContinue] Unknown message action:', message.action);
    }
    return false;
  } catch (err) {
    if (
      err instanceof Error &&
      err.message &&
      err.message.includes('Extension context invalidated')
    ) {
      console.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
    } else {
      console.error('[AutoContinue] Error handling message:', err);
    }
    return false;
  }
});

function isUserIdle(): boolean {
  return Date.now() - lastInteractionTime > idleTimeout;
}

function processInteraction(): void {
  lastInteractionTime = Date.now();
}

async function autoClickContinue(): Promise<boolean> {
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
          console.error('[AutoContinue] Failed to update local stats:', error);
        });

        setTimeout(async () => {
          try {
            await chrome.storage.local.set({ autoContinueInProgress: false });
          } catch (error) {
            console.error('[AutoContinue] Failed to reset auto-continue flag:', error);
          }
        }, 1000);

        console.log('[AutoContinue] Auto-continue button clicked successfully');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[AutoContinue] Error in autoClickContinue:', error);
    return false;
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

async function loadAutoconfirmSettings(): Promise<void> {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.warn('[AutoContinue] Chrome storage API not available, using defaults');
      isAutoconfirmEnabled = true;
      idleTimeout = 5000;
      return;
    }

    const result = await chrome.storage.local.get(['enabled', 'idleTimeout']);
    isAutoconfirmEnabled = result.enabled !== false;
    idleTimeout = (result.idleTimeout || 5) * 1000;
    console.log('[AutoContinue] Settings loaded:', { isAutoconfirmEnabled, idleTimeout });
  } catch (error) {
    console.error('[AutoContinue] Failed to load settings:', error);
    isAutoconfirmEnabled = true;
    idleTimeout = 5000;
  }
}

function setupAutoconfirmListeners(): void {
  ['mousedown', 'mousemove', 'keypress', 'keydown', 'touchstart', 'scroll'].forEach(eventType => {
    document.addEventListener(eventType, processInteraction, { passive: true });
  });

  document.addEventListener('yt-popup-opened', (event: Event) => {
    const customEvent = event as CustomEvent<{ nodeName?: string }>;
    const detail = customEvent.detail;
    if (
      detail &&
      (detail.nodeName === 'YT-CONFIRM-DIALOG-RENDERER' ||
        detail.nodeName === 'YTMUSIC-YOU-THERE-RENDERER')
    ) {
      console.log('[AutoContinue] Continue watching popup detected');
      if (isAutoconfirmEnabled && isUserIdle()) {
        setTimeout(async () => {
          await autoClickContinue();
        }, 100);
      }
    }
  });

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
              if (isAutoconfirmEnabled && isUserIdle()) {
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

  observer.observe(document.body, { childList: true, subtree: true });

  cleanupFunctions.push(() => {
    observer.disconnect();
  });
}
