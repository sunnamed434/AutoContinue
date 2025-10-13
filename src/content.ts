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

    const script = document.createElement('script');
    const scriptUrl = chrome.runtime.getURL('js/autoconfirm.js');

    if (!scriptUrl.startsWith('chrome-extension://')) {
      console.error('[AutoContinue] Invalid script URL, potential security risk');
      return;
    }

    script.src = scriptUrl;
    script.setAttribute('data-autocontinue', 'true');
    script.onload = function (): void {
      autoconfirmScriptInjected = true;
      const scriptElement = script;
      if (scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
    script.onerror = function (): void {
      console.error('[AutoContinue] Failed to load autoconfirm script');
      autoconfirmScriptInjected = false;
    };

    const targetElement = document.head || document.documentElement;
    if (targetElement && targetElement.nodeType === Node.ELEMENT_NODE) {
      targetElement.appendChild(script);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
    } else {
      console.error('[AutoContinue] Error injecting autoconfirm script:', error);
    }
  }
}

async function initializeExtension(): Promise<void> {
  injectAutoconfirmScript();
  setupFallbackAutoContinue();
  setupVisibilityListener();
  await sendSettingsToAutoconfirm();

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

async function sendSettingsToAutoconfirm(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(['enabled', 'idleTimeout', 'enableYouTubeMusic']);

    const settings = {
      enabled: result['enabled'] !== false,
      idleTimeout: result['idleTimeout'] || 5,
      enableYouTubeMusic: result['enableYouTubeMusic'] !== false,
    };

    const event = new CustomEvent('autocontinue-settings-updated', {
      detail: settings,
    });
    window.dispatchEvent(event);

    console.log('[AutoContinue] Settings sent to autoconfirm script:', settings);
  } catch (error) {
    console.error('[AutoContinue] Failed to send settings to autoconfirm script:', error);
  }
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

function setupVisibilityListener(): void {
  document.addEventListener('visibilitychange', () => {
    try {
      if (document.hidden) {
        chrome.runtime.sendMessage({ action: 'tabHidden' });
      } else {
        chrome.runtime.sendMessage({ action: 'tabVisible' });
      }
    } catch (error) {
      console.warn('[AutoContinue] Failed to send visibility message:', error);
    }
  });
}

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

function setupFallbackAutoContinue(): void {
  console.log('[AutoContinue] Setting up fallback auto-continue logic...');
}
