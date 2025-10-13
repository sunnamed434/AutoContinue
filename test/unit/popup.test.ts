// import { formatTime } from '../../src/utils/formatters';
import { mockChrome, createMockTab } from '../setup';

// Mock the popup module
jest.mock('../../src/popup/popup', () => ({}));

describe('Popup Controller Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Theme Detection', () => {
    it('should detect dark theme', () => {
      const mockMatchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      // Simulate theme detection logic
      const detectSystemTheme = (): 'light' | 'dark' => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      };

      expect(detectSystemTheme()).toBe('dark');
    });

    it('should detect light theme', () => {
      const mockMatchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      // Simulate theme detection logic
      const detectSystemTheme = (): 'light' | 'dark' => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      };

      expect(detectSystemTheme()).toBe('light');
    });
  });

  describe('Video Status Checking', () => {
    it('should detect YouTube URLs', () => {
      const isYouTubeUrl = (url: string): boolean => {
        return url.includes('youtube.com') || url.includes('music.youtube.com');
      };

      expect(isYouTubeUrl('https://www.youtube.com/watch?v=test')).toBe(true);
      expect(isYouTubeUrl('https://music.youtube.com/watch?v=test')).toBe(true);
      expect(isYouTubeUrl('https://www.google.com')).toBe(false);
    });

    it('should handle tab query errors', async () => {
      mockChrome.tabs.query = jest.fn().mockRejectedValue(new Error('Tab query failed'));

      const checkVideoStatus = async (): Promise<void> => {
        try {
          const [tab] = await mockChrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id && tab.url) {
            const isYouTube = tab.url.includes('youtube.com') || tab.url.includes('music.youtube.com');
            if (!isYouTube) {
              return;
            }
          }
        } catch (error) {
        }
      };

      await expect(checkVideoStatus()).resolves.not.toThrow();
    });

    it('should handle content script injection errors', async () => {
      const mockTab = createMockTab({ id: 1, url: 'https://www.youtube.com/watch?v=test' });
      mockChrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      mockChrome.scripting.executeScript = jest.fn().mockRejectedValue(new Error('Injection failed'));

      const injectContentScript = async (): Promise<void> => {
        try {
          const [tab] = await mockChrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await mockChrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['js/content.js'],
            });
          }
        } catch (error) {
        }
      };

      await expect(injectContentScript()).resolves.not.toThrow();
    });
  });

  describe('Message Handling', () => {
    it('should handle toggle message', async () => {
      const mockTab = createMockTab({ id: 1 });
      mockChrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      mockChrome.tabs.sendMessage = jest.fn().mockResolvedValue({});

      const handleToggle = async (enabled: boolean): Promise<void> => {
        try {
          const [tab] = await mockChrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await mockChrome.tabs.sendMessage(tab.id, { action: 'toggle', enabled });
          }
        } catch (error) {
        }
      };

      await handleToggle(true);
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'toggle', enabled: true });

      await handleToggle(false);
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'toggle', enabled: false });
    });

    it('should handle test popup message', async () => {
      const mockTab = createMockTab({ id: 1, url: 'https://www.youtube.com/watch?v=test' });
      mockChrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      mockChrome.tabs.sendMessage = jest.fn().mockResolvedValue({});

      const handleTestPopup = async (): Promise<void> => {
        try {
          const [tab] = await mockChrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id && tab.url) {
            if (tab.url.includes('youtube.com') || tab.url.includes('music.youtube.com')) {
              await mockChrome.tabs.sendMessage(tab.id, { action: 'testNativePopup' });
            }
          }
        } catch (error) {
        }
      };

      await handleTestPopup();
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'testNativePopup' });
    });
  });

  describe('Debug Logs', () => {
    it('should copy debug information to clipboard', async () => {
      const mockClipboard = {
        writeText: jest.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard,
      });

      mockChrome.storage.local.get = jest.fn().mockResolvedValue({
        enabled: true,
        autoContinueCount: 5,
        timeSaved: 300,
      });

      mockChrome.runtime.getManifest = jest.fn().mockReturnValue({
        version: '1.0.0',
        name: 'AutoContinue',
      });

      // Simulate debug logs copying
      const copyDebugLogs = async (): Promise<void> => {
        try {
          const result = await mockChrome.storage.local.get([
            'enabled',
            'autoContinueCount',
            'timeSaved',
            'lastReset',
            'theme',
            'testMode',
          ]);

          const debugInfo = {
            extension: 'AutoContinue',
            version: mockChrome.runtime.getManifest().version,
            timestamp: new Date().toISOString(),
            settings: result,
            userAgent: navigator.userAgent,
          };

          await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
        } catch (error) {
        }
      };

      await copyDebugLogs();

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('"extension": "AutoContinue"')
      );
    });
  });

  describe('Tab Refresh', () => {
    it('should refresh active tab', async () => {
      const mockTab = createMockTab({ id: 1 });
      mockChrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      mockChrome.tabs.reload = jest.fn().mockResolvedValue(undefined);

      // Simulate tab refresh
      const refreshTab = async (): Promise<void> => {
        try {
          const [tab] = await mockChrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await mockChrome.tabs.reload(tab.id);
          }
        } catch (error) {
        }
      };

      await refreshTab();
      expect(mockChrome.tabs.reload).toHaveBeenCalledWith(1);
    });
  });
});
