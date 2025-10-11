console.log(`[AutoContinue v${chrome.runtime.getManifest().version}] Content script loaded`);
console.log('[AutoContinue] Content script is ready to receive messages');

function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime && !!chrome.runtime.getURL;
  } catch (error) {
    return false;
  }
}

function injectAutoconfirmScript(): void {
  try {
    if (!isExtensionContextValid()) {
      console.warn('[AutoContinue] Extension context invalidated, skipping script injection');
      return;
    }

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/autoconfirm.js');
    script.onload = function (): void {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    };
    script.onerror = function (): void {
      console.error('[AutoContinue] Failed to load autoconfirm script');
    };

    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.warn('[AutoContinue] Extension context invalidated, please reload the page');
    } else {
      console.error('[AutoContinue] Error injecting autoconfirm script:', error);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectAutoconfirmScript();
    setupFallbackAutoContinue();
  });
} else {
  injectAutoconfirmScript();
  setupFallbackAutoContinue();
}

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(injectAutoconfirmScript, 100);
  }
}).observe(document, { subtree: true, childList: true });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (!isExtensionContextValid()) {
      console.warn('[AutoContinue] Extension context invalidated, cannot handle message');
      return;
    }

    console.log('[AutoContinue] Message received:', message);

    switch (message.action) {
      case 'testPopup':
        testPopupFunctionality();
        break;
      case 'toggle':
        console.log('[AutoContinue] Extension', message.enabled ? 'enabled' : 'disabled');
        break;
      default:
        console.warn('[AutoContinue] Unknown message action:', message.action);
    }
  } catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.warn('[AutoContinue] Extension context invalidated, please reload the page');
    } else {
      console.error('[AutoContinue] Error handling message:', error);
    }
  }
});

function testPopupFunctionality(): void {
  console.log('[AutoContinue] Testing popup functionality...');

  const video = document.querySelector('video') as HTMLVideoElement;
  if (!video) {
    alert('No video found on this page. Please go to a YouTube video page to test.');
    return;
  }

  console.log('[AutoContinue] Pausing video for test...');
  video.pause();
  const overlay = document.createElement('div');
  overlay.id = 'autocontinue-test-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    color: #333;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    border: 1px solid #e9ecef;
  `;

  modal.innerHTML = `
    <div style="margin-bottom: 25px;">
      <div style="font-size: 48px; margin-bottom: 15px; color: #007bff;">⏸</div>
      <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 600; color: #2c3e50;">Continue watching?</h2>
      <p style="margin: 0; color: #6c757d; font-size: 15px;">Video paused. Continue watching?</p>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 20px;">
      <button id="autocontinue-test-continue" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        min-width: 120px;
        transition: all 0.2s;
      ">Continue watching</button>
      <button id="autocontinue-test-close" style="
        background: #6c757d;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        min-width: 120px;
        transition: all 0.2s;
      ">Cancel</button>
    </div>
    <div style="font-size: 12px; color: #6c757d; padding: 10px; background: #f8f9fa; border-radius: 6px;">
      Test Mode: This simulates YouTube's "Continue watching?" popup
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  const continueBtn = document.getElementById('autocontinue-test-continue');
  const closeBtn = document.getElementById('autocontinue-test-close');
  if (continueBtn) {
    continueBtn.addEventListener('mouseenter', () => {
      continueBtn.style.background = '#0056b3';
    });
    continueBtn.addEventListener('mouseleave', () => {
      continueBtn.style.background = '#007bff';
    });
    continueBtn.addEventListener('click', () => {
      console.log('[AutoContinue] Test popup - Continue button clicked!');
      document.body.removeChild(overlay);

      if (video.paused) {
        video.play().catch(e => console.log('[AutoContinue] Could not resume video:', e));
      }

      showTestResult('AutoContinue automatically clicked "Continue watching"!', 'success');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#545b62';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = '#6c757d';
    });
    closeBtn.addEventListener('click', () => {
      console.log('[AutoContinue] Test popup - Cancel button clicked');
      document.body.removeChild(overlay);

      if (video.paused) {
        video.play().catch(e => console.log('[AutoContinue] Could not resume video:', e));
      }

      showTestResult('Test popup cancelled manually', 'info');
    });
  }

  setTimeout(() => {
    if (document.body.contains(overlay)) {
      console.log(
        '[AutoContinue] Auto-clicking Continue button to demonstrate AutoContinue behavior'
      );
      if (continueBtn) {
        continueBtn.click();
      }
    }
  }, 3000);

  setTimeout(() => {
    if (document.body.contains(overlay)) {
      console.log('[AutoContinue] Test popup timed out');
      document.body.removeChild(overlay);

      if (video.paused) {
        video.play().catch(e => console.log('[AutoContinue] Could not resume video:', e));
      }

      showTestResult('Test popup timed out', 'info');
    }
  }, 10000);
}

// Fallback auto-continue logic (works even if injected script fails)
function setupFallbackAutoContinue(): void {
  console.log('[AutoContinue] Setting up fallback auto-continue logic...');

  // Listen for YouTube's popup events
  document.addEventListener('yt-popup-opened', (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail && customEvent.detail.nodeName === 'YT-CONFIRM-DIALOG-RENDERER') {
      console.log('[AutoContinue] "Continue watching?" popup detected (fallback)');

      // Try to find and click the continue button
      setTimeout(() => {
        const selectors = [
          'button[aria-label*="Continue"]',
          'button[aria-label*="continue"]',
          'yt-button-renderer button',
          '#confirm-button',
        ];

        for (const selector of selectors) {
          const button = document.querySelector<HTMLButtonElement>(selector);
          if (button && button.offsetParent !== null) {
            console.log('[AutoContinue] Auto-clicking continue button (fallback)');
            button.click();

            // Try to play video if paused
            const video = document.querySelector<HTMLVideoElement>('video');
            if (video && video.paused) {
              video.play().catch(e => console.error('[AutoContinue] Failed to play video:', e));
            }
            return;
          }
        }
        console.log('[AutoContinue] No continue button found (fallback)');
      }, 100);
    }
  });
}

function showTestResult(message: string, type: 'success' | 'info'): void {
  const resultDiv = document.createElement('div');
  resultDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${type === 'success' ? '#4CAF50' : '#007bff'};
    color: white;
    padding: 20px 30px;
    border-radius: 12px;
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    text-align: center;
    border: 1px solid ${type === 'success' ? '#45a049' : '#0056b3'};
    animation: fadeInScale 0.3s ease-out;
  `;
  resultDiv.textContent = message;

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(resultDiv);

  // Show for longer and add fade out animation
  setTimeout(() => {
    if (document.body.contains(resultDiv)) {
      resultDiv.style.animation = 'fadeInScale 0.3s ease-out reverse';
      setTimeout(() => {
        if (document.body.contains(resultDiv)) {
          document.body.removeChild(resultDiv);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 300);
    }
  }, 5000);
}
