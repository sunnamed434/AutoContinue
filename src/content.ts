import { logger } from './utils/logger';

logger.log(`[AutoContinue v${chrome.runtime.getManifest().version}] Content script loaded`);
logger.log('[AutoContinue] Content script is ready to receive messages');

function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime && !!chrome.runtime.getURL && !!chrome.runtime.id;
  } catch {
    return false;
  }
}

function checkForVideoElement(): boolean {
  const videos = document.querySelectorAll('video');
  logger.log('[AutoContinue] Found', videos.length, 'video elements');

  for (const video of videos) {
    const htmlVideo = video as HTMLVideoElement;

    if (htmlVideo.duration && htmlVideo.duration > 0) {
      logger.log('[AutoContinue] Found video with duration:', htmlVideo.duration);

      if (htmlVideo.offsetHeight > 0 && htmlVideo.offsetWidth > 0) {
        const boundingRect = htmlVideo.getBoundingClientRect();
        const elementAtPoint =
          document.elementFromPoint(
            boundingRect.left + boundingRect.width / 2,
            boundingRect.top + boundingRect.height / 2
          ) || document.elementFromPoint(boundingRect.left, boundingRect.top);

        if (
          elementAtPoint === htmlVideo ||
          (elementAtPoint && htmlVideo.contains(elementAtPoint)) ||
          (elementAtPoint && elementAtPoint.contains(htmlVideo)) ||
          !!elementAtPoint?.closest('.html5-video-player')?.contains(htmlVideo) ||
          !!htmlVideo.closest('#inline-preview-player')?.classList?.contains('playing-mode')
        ) {
          logger.log('[AutoContinue] Video is visible');
          return true;
        }
      }

      if (
        htmlVideo.classList.contains('html5-main-video') ||
        htmlVideo.id === 'player' ||
        htmlVideo.id === 'player_html5_api'
      ) {
        logger.log('[AutoContinue] Found main video element');
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
        logger.log('[AutoContinue] Found video in container:', containerSelector);
        return true;
      }
    }
  }

  const musicPlayer = document.querySelector('ytmusic-player');
  if (musicPlayer) {
    const musicVideo = musicPlayer.querySelector('video') as HTMLVideoElement;
    if (musicVideo && musicVideo.duration && musicVideo.duration > 0) {
      logger.log('[AutoContinue] Found video in YouTube Music player');
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
      logger.log('[AutoContinue] Found valid video element as fallback');
      return true;
    }
  }

  return false;
}

let autoconfirmScriptInjected = false;

function injectAutoconfirmScript(): void {
  try {
    if (!isExtensionContextValid()) {
      logger.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
      return;
    }

    if (autoconfirmScriptInjected) {
      return;
    }

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/autoconfirm.js');
    script.onload = () => {
      logger.log('[AutoContinue] Autoconfirm script loaded successfully');
    };
    script.onerror = () => {
      logger.error('[AutoContinue] Failed to load autoconfirm script');
    };
    (document.head || document.documentElement).appendChild(script);

    autoconfirmScriptInjected = true;
    logger.log('[AutoContinue] Autoconfirm functionality enabled');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      logger.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
    } else {
      logger.error('[AutoContinue] Error enabling autoconfirm functionality:', error);
    }
  }
}

async function initializeExtension(): Promise<void> {
  injectAutoconfirmScript();
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
}

setupUrlObserver();

function cleanup(): void {
  logger.log('[AutoContinue] Cleaning up resources...');
  if (urlObserver) {
    urlObserver.disconnect();
    urlObserver = null;
  }
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

    if (Object.keys(settings).length > 0) {
      const event = new CustomEvent('autocontinue-settings-updated', {
        detail: settings,
      });
      window.dispatchEvent(event);
      logger.log('[AutoContinue] Settings updated and sent to autoconfirm script:', settings);
    }
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (!isExtensionContextValid()) {
      logger.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
      return false;
    }

    logger.log('[AutoContinue] Message received:', message);

    switch (message.action) {
      case 'checkVideo': {
        const hasVideo = checkForVideoElement();
        logger.log('[AutoContinue] Final video check result:', hasVideo);
        sendResponse({ hasVideo });
        return true;
      }
      case 'toggle':
        logger.log('[AutoContinue] Extension', message.enabled ? 'enabled' : 'disabled');
        break;
      default:
        logger.warn('[AutoContinue] Unknown message action:', message.action);
    }
    return false;
  } catch (err) {
    if (
      err instanceof Error &&
      err.message &&
      err.message.includes('Extension context invalidated')
    ) {
      logger.warn(
        '[AutoContinue] Extension context invalidated, please reload the page to re-enable AutoContinue'
      );
    } else {
      logger.error('[AutoContinue] Error handling message:', err);
    }
    return false;
  }
});
