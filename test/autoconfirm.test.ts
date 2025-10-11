/**
 * AutoContinue - Autoconfirm Logic Tests
 * 
 * Tests the main autoconfirm functionality without waiting for actual YouTube popups
 */

import { createMockYouTubePage, createMockContinuePopup, simulateUserInteraction } from './setup';

// Mock the autoconfirm module
jest.mock('../src/autoconfirm', () => {
  const originalModule = jest.requireActual('../src/autoconfirm');
  return {
    ...originalModule,
    // Mock functions that interact with Chrome APIs
    updateStatistics: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  };
});

describe('AutoContinue - Autoconfirm Logic', () => {
  beforeEach(() => {
    // Reset DOM and mocks before each test
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    jest.clearAllMocks();
    
    // Create mock YouTube page
    createMockYouTubePage();
  });

  describe('YouTube Page Detection', () => {
    test('should detect YouTube Music correctly', () => {
      // Mock YouTube Music URL
      Object.defineProperty(window, 'location', {
        value: { hostname: 'music.youtube.com' },
        writable: true
      });

      // Import and test the detection logic
      const { IS_YOUTUBE_MUSIC } = require('../src/autoconfirm');
      expect(IS_YOUTUBE_MUSIC).toBe(true);
    });

    test('should detect mobile YouTube correctly', () => {
      // Mock mobile YouTube URL
      Object.defineProperty(window, 'location', {
        value: { hostname: 'm.youtube.com' },
        writable: true
      });

      const { IS_MOBILE_YOUTUBE } = require('../src/autoconfirm');
      expect(IS_MOBILE_YOUTUBE).toBe(true);
    });

    test('should detect regular YouTube correctly', () => {
      // Mock regular YouTube URL
      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.youtube.com' },
        writable: true
      });

      const { IS_YOUTUBE_MUSIC, IS_MOBILE_YOUTUBE } = require('../src/autoconfirm');
      expect(IS_YOUTUBE_MUSIC).toBe(false);
      expect(IS_MOBILE_YOUTUBE).toBe(false);
    });
  });

  describe('User Interaction Detection', () => {
    test('should track mouse interactions', () => {
      const { processInteraction } = require('../src/autoconfirm');
      
      // Simulate mouse interaction
      simulateUserInteraction('mouse');
      
      // Check that interaction was processed
      expect(processInteraction).toHaveBeenCalled();
    });

    test('should track keyboard interactions', () => {
      const { processInteraction } = require('../src/autoconfirm');
      
      // Simulate keyboard interaction
      simulateUserInteraction('keyboard');
      
      expect(processInteraction).toHaveBeenCalled();
    });

    test('should track touch interactions', () => {
      const { processInteraction } = require('../src/autoconfirm');
      
      // Simulate touch interaction
      simulateUserInteraction('touch');
      
      expect(processInteraction).toHaveBeenCalled();
    });
  });

  describe('Idle State Detection', () => {
    test('should detect idle state after timeout', () => {
      const { isIdle, getIdleTime } = require('../src/autoconfirm');
      
      // Initially should not be idle
      expect(isIdle()).toBe(false);
      
      // Mock time to simulate idle state
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 10000); // 10 seconds later
      
      expect(isIdle()).toBe(true);
      expect(getIdleTime()).toBeGreaterThan(5000);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });

    test('should reset idle state on user interaction', () => {
      const { processInteraction, isIdle } = require('../src/autoconfirm');
      
      // Simulate user interaction
      processInteraction('mousedown');
      
      // Should not be idle immediately after interaction
      expect(isIdle()).toBe(false);
    });
  });

  describe('Video Pause Override', () => {
    test('should override video pause method', () => {
      const video = document.querySelector('video') as HTMLVideoElement;
      expect(video).toBeTruthy();
      
      // Mock the override function
      const { overrideVideoPause } = require('../src/autoconfirm');
      overrideVideoPause();
      
      // Check that pause method was overridden
      expect(video.yns_pause).toBeDefined();
      expect(typeof video.pause).toBe('function');
    });

    test('should handle user-initiated pause correctly', () => {
      const video = document.querySelector('video') as HTMLVideoElement;
      const { overrideVideoPause, processInteraction } = require('../src/autoconfirm');
      
      overrideVideoPause();
      
      // Simulate user interaction first
      processInteraction('mousedown');
      
      // Now pause should work normally (user is active)
      const pauseSpy = jest.spyOn(video, 'yns_pause');
      video.pause();
      
      expect(pauseSpy).toHaveBeenCalled();
    });

    test('should handle auto-pause correctly', () => {
      const video = document.querySelector('video') as HTMLVideoElement;
      const { overrideVideoPause } = require('../src/autoconfirm');
      
      overrideVideoPause();
      
      // Mock idle state
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 10000);
      
      // Auto-pause should set pauseRequested flag
      video.pause();
      
      // Check that pause was requested but not executed immediately
      const { pauseRequested } = require('../src/autoconfirm');
      expect(pauseRequested).toBe(true);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('Popup Detection and Auto-Click', () => {
    test('should detect continue watching popup', () => {
      const popup = createMockContinuePopup();
      const { autoClickContinue } = require('../src/autoconfirm');
      
      // Mock the popup detection
      const button = popup.querySelector('button');
      expect(button).toBeTruthy();
      
      // Test auto-click functionality
      const clickSpy = jest.spyOn(button!, 'click');
      autoClickContinue();
      
      expect(clickSpy).toHaveBeenCalled();
    });

    test('should handle popup event correctly', () => {
      const { listenForPopupEvent } = require('../src/autoconfirm');
      
      // Set up popup event listener
      listenForPopupEvent();
      
      // Create and dispatch popup event
      const event = new CustomEvent('yt-popup-opened', {
        detail: { nodeName: 'YT-CONFIRM-DIALOG-RENDERER' }
      });
      
      // Mock idle state
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 10000);
      
      document.dispatchEvent(event);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });

    test('should use fallback selectors for continue button', () => {
      const { SELECTORS } = require('../src/autoconfirm');
      
      // Test that multiple selectors are available
      expect(SELECTORS.CONFIRM_BUTTON).toBeInstanceOf(Array);
      expect(SELECTORS.CONFIRM_BUTTON.length).toBeGreaterThan(1);
      
      // Test specific selectors
      expect(SELECTORS.CONFIRM_BUTTON).toContain('button[aria-label*="Continue"]');
      expect(SELECTORS.CONFIRM_BUTTON).toContain('yt-button-renderer button');
    });
  });

  describe('Media Key Handling', () => {
    test('should handle media key pause', () => {
      const { listenForMediaKeys } = require('../src/autoconfirm');
      
      // Mock navigator.mediaSession
      const mockSetActionHandler = jest.fn();
      Object.defineProperty(navigator, 'mediaSession', {
        value: {
          setActionHandler: mockSetActionHandler
        },
        writable: true
      });
      
      listenForMediaKeys();
      
      expect(mockSetActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));
    });

    test('should prevent other scripts from overriding pause handler', () => {
      const { listenForMediaKeys } = require('../src/autoconfirm');
      
      const originalSetActionHandler = jest.fn();
      Object.defineProperty(navigator, 'mediaSession', {
        value: {
          setActionHandler: originalSetActionHandler
        },
        writable: true
      });
      
      listenForMediaKeys();
      
      // Try to override pause handler
      const newHandler = jest.fn();
      navigator.mediaSession.setActionHandler('pause', newHandler);
      
      // Should not have called the original handler
      expect(originalSetActionHandler).not.toHaveBeenCalledWith('pause', newHandler);
    });
  });

  describe('Statistics Tracking', () => {
    test('should update statistics on auto-continue', () => {
      const { updateStatistics } = require('../src/autoconfirm');
      
      // Mock chrome.storage.local
      const mockGet = jest.fn().mockResolvedValue({
        autoContinueCount: 5,
        timeSaved: 25
      });
      const mockSet = jest.fn().mockResolvedValue(undefined);
      
      (global as any).chrome = {
        storage: {
          local: {
            get: mockGet,
            set: mockSet
          }
        }
      };
      
      updateStatistics();
      
      expect(mockGet).toHaveBeenCalledWith(['autoContinueCount', 'timeSaved']);
      expect(mockSet).toHaveBeenCalledWith({
        autoContinueCount: 6,
        timeSaved: 30,
        lastReset: expect.any(Number)
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing video element gracefully', () => {
      // Remove video element
      const video = document.querySelector('video');
      video?.remove();
      
      const { overrideVideoPause } = require('../src/autoconfirm');
      
      // Should not throw error
      expect(() => overrideVideoPause()).not.toThrow();
    });

    test('should handle missing app element gracefully', () => {
      // Remove app element
      const app = document.querySelector('#ytd-app');
      app?.remove();
      
      const { observeApp } = require('../src/autoconfirm');
      
      // Should not throw error
      expect(() => observeApp()).not.toThrow();
    });
  });

  describe('Configuration Constants', () => {
    test('should have proper timeout values', () => {
      const { CONFIG } = require('../src/autoconfirm');
      
      expect(CONFIG.PAUSE_REQUESTED_TIMEOUT).toBe(5000);
      expect(CONFIG.IDLE_TIMEOUT).toBe(5000);
      expect(CONFIG.OBSERVER_THROTTLE).toBe(100);
      expect(CONFIG.MAX_RETRIES).toBe(3);
    });

    test('should have proper selectors for different platforms', () => {
      const { SELECTORS } = require('../src/autoconfirm');
      
      expect(SELECTORS.APP).toBe('ytd-app');
      expect(SELECTORS.POPUP_CONTAINER).toBe('ytd-popup-container');
      expect(SELECTORS.POPUP_EVENT_NODE).toBe('YT-CONFIRM-DIALOG-RENDERER');
      expect(SELECTORS.VIDEO).toBe('video');
    });
  });
});
