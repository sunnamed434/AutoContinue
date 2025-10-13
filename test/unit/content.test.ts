import { isExtensionContextValid, isVideoVisible, checkForVideoElement } from '../../src/content';
import { videoElementFactory, mockGetBoundingClientRect, mockElementFromPoint } from '../helpers/mocks';
import { mockChrome } from '../setup';

describe('Content Script Logic', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('isExtensionContextValid', () => {
    it('should return true when chrome runtime is available', () => {
      // Mock chrome runtime as available
      mockChrome.runtime.getURL = jest.fn().mockReturnValue('chrome-extension://test-id/script.js');
      (mockChrome.runtime as any).id = 'test-id';

      expect(isExtensionContextValid()).toBe(true);
    });

    it('should return false when chrome runtime is not available', () => {
      // Mock chrome runtime as unavailable
      (mockChrome.runtime as any).getURL = undefined;
      (mockChrome.runtime as any).id = undefined;

      expect(isExtensionContextValid()).toBe(false);
    });

    it('should return false when chrome runtime throws error', () => {
      // Mock chrome runtime to throw error
      mockChrome.runtime.getURL = jest.fn().mockImplementation(() => {
        throw new Error('Extension context invalidated');
      });

      expect(isExtensionContextValid()).toBe(false);
    });

    it('should return false when chrome is undefined', () => {
      // Temporarily remove chrome
      const originalChrome = (global as any).chrome;
      delete (global as any).chrome;

      expect(isExtensionContextValid()).toBe(false);

      // Restore chrome
      (global as any).chrome = originalChrome;
    });
  });

  describe('isVideoVisible', () => {
    it('should return false for null video', () => {
      expect(isVideoVisible(null as any)).toBe(false);
    });

    it('should return false for video with zero dimensions', () => {
      const video = videoElementFactory.hidden();
      expect(isVideoVisible(video)).toBe(false);
    });

    it('should return true for visible video', () => {
      const video = videoElementFactory.standard();
      mockGetBoundingClientRect(video, { width: 1280, height: 720 });
      mockElementFromPoint(video);

      expect(isVideoVisible(video)).toBe(true);
    });

    it('should return true when element at point is the video itself', () => {
      const video = videoElementFactory.standard();
      mockGetBoundingClientRect(video, { width: 1280, height: 720 });
      mockElementFromPoint(video);

      expect(isVideoVisible(video)).toBe(true);
    });

    it('should return true when element at point is contained by video', () => {
      const video = videoElementFactory.standard();
      const childElement = document.createElement('div');
      video.appendChild(childElement);
      
      mockGetBoundingClientRect(video, { width: 1280, height: 720 });
      mockElementFromPoint(childElement);

      expect(isVideoVisible(video)).toBe(true);
    });

    it('should return true when video is contained by element at point', () => {
      const video = videoElementFactory.standard();
      const parentElement = document.createElement('div');
      parentElement.appendChild(video);
      
      mockGetBoundingClientRect(video, { width: 1280, height: 720 });
      mockElementFromPoint(parentElement);

      expect(isVideoVisible(video)).toBe(true);
    });

    it('should return true for video in html5-video-player container', () => {
      const video = videoElementFactory.standard();
      const container = document.createElement('div');
      container.className = 'html5-video-player';
      container.appendChild(video);
      document.body.appendChild(container);
      
      mockGetBoundingClientRect(video, { width: 1280, height: 720 });
      mockElementFromPoint(container);

      expect(isVideoVisible(video)).toBe(true);
    });

    it('should return true for video in inline-preview-player with playing-mode', () => {
      const video = videoElementFactory.standard();
      const container = document.createElement('div');
      container.id = 'inline-preview-player';
      container.classList.add('playing-mode');
      container.appendChild(video);
      document.body.appendChild(container);
      
      mockGetBoundingClientRect(video, { width: 1280, height: 720 });
      mockElementFromPoint(container);

      expect(isVideoVisible(video)).toBe(true);
    });

    it('should return false when element at point is not related to video', () => {
      const video = videoElementFactory.standard();
      const otherElement = document.createElement('div');
      document.body.appendChild(video);
      document.body.appendChild(otherElement);
      
      mockGetBoundingClientRect(video, { width: 1280, height: 720 });
      mockElementFromPoint(otherElement);

      expect(isVideoVisible(video)).toBe(false);
    });
  });

  describe('checkForVideoElement', () => {
    it('should return true when video with duration is found', () => {
      const video = videoElementFactory.standard();
      document.body.appendChild(video);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return false when no videos are found', () => {
      // Empty DOM
      document.body.innerHTML = '';

      expect(checkForVideoElement()).toBe(false);
    });

    it('should return false when video has no duration', () => {
      const video = videoElementFactory.noDuration();
      document.body.appendChild(video);

      expect(checkForVideoElement()).toBe(false);
    });

    it('should return true for visible video', () => {
      const video = videoElementFactory.standard();
      mockGetBoundingClientRect(video, { width: 1280, height: 720 });
      mockElementFromPoint(video);
      document.body.appendChild(video);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for main video element by class', () => {
      const video = videoElementFactory.standard();
      video.classList.add('html5-main-video');
      document.body.appendChild(video);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for main video element by id', () => {
      const video = videoElementFactory.standard();
      video.id = 'player';
      document.body.appendChild(video);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for player_html5_api video', () => {
      const video = videoElementFactory.standard();
      video.id = 'player_html5_api';
      document.body.appendChild(video);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for video in movie_player container', () => {
      const container = document.createElement('div');
      container.id = 'movie_player';
      const video = videoElementFactory.standard();
      container.appendChild(video);
      document.body.appendChild(container);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for video in player container', () => {
      const container = document.createElement('div');
      container.id = 'player';
      const video = videoElementFactory.standard();
      container.appendChild(video);
      document.body.appendChild(container);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for video in ytd-player container', () => {
      const container = document.createElement('ytd-player');
      const video = videoElementFactory.standard();
      container.appendChild(video);
      document.body.appendChild(container);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for video in ytd-watch-flexy container', () => {
      const container = document.createElement('ytd-watch-flexy');
      const video = videoElementFactory.standard();
      container.appendChild(video);
      document.body.appendChild(container);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for video in html5-video-player container', () => {
      const container = document.createElement('div');
      container.className = 'html5-video-player';
      const video = videoElementFactory.standard();
      container.appendChild(video);
      document.body.appendChild(container);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for video in ytd-video-player container', () => {
      const container = document.createElement('ytd-video-player');
      const video = videoElementFactory.standard();
      container.appendChild(video);
      document.body.appendChild(container);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for video in ytd-music-player container', () => {
      const container = document.createElement('ytd-music-player');
      const video = videoElementFactory.standard();
      container.appendChild(video);
      document.body.appendChild(container);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for video in ytmusic-player container', () => {
      const container = document.createElement('ytmusic-player');
      const video = videoElementFactory.standard();
      container.appendChild(video);
      document.body.appendChild(container);

      expect(checkForVideoElement()).toBe(true);
    });

    it('should return true for fallback video with valid dimensions', () => {
      const video = videoElementFactory.standard();
      Object.defineProperty(video, 'offsetWidth', { value: 640, writable: true });
      Object.defineProperty(video, 'offsetHeight', { value: 360, writable: true });
      document.body.appendChild(video);

      expect(checkForVideoElement()).toBe(true);
    });
  });
});
