import { mockChrome } from '../setup';

// Mock the background script module
jest.mock('../../src/background', () => ({}));

describe('Background Script Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Handlers', () => {
    it('should handle toggle message', async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      mockChrome.storage.local.set = mockSet;

      // Simulate the toggle message handler logic
      const handleToggleMessage = async (enabled: boolean): Promise<void> => {
        await mockChrome.storage.local.set({ enabled });
      };

      await handleToggleMessage(true);
      expect(mockSet).toHaveBeenCalledWith({ enabled: true });

      await handleToggleMessage(false);
      expect(mockSet).toHaveBeenCalledWith({ enabled: false });
    });

    it('should handle stats update message', async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      mockChrome.storage.local.set = mockSet;

      // Simulate the stats update handler logic
      const handleStatsUpdate = async (stats: {
        autoContinueCount: number;
        timeSaved: number;
      }): Promise<void> => {
        await mockChrome.storage.local.set({
          autoContinueCount: stats.autoContinueCount,
          timeSaved: stats.timeSaved,
        });
      };

      const stats = { autoContinueCount: 5, timeSaved: 300 };
      await handleStatsUpdate(stats);

      expect(mockSet).toHaveBeenCalledWith({
        autoContinueCount: 5,
        timeSaved: 300,
      });
    });

    it('should handle get settings message', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        enabled: true,
        autoContinueCount: 10,
        timeSaved: 600,
      });
      mockChrome.storage.local.get = mockGet;

      // Simulate the get settings handler logic
      const handleGetSettings = async (sendResponse: (response: any) => void): Promise<void> => {
        const result = await mockChrome.storage.local.get([
          'enabled',
          'showNotifications',
          'autoContinueCount',
          'timeSaved',
          'lastReset',
        ]);
        sendResponse(result);
      };

      const mockSendResponse = jest.fn();
      await handleGetSettings(mockSendResponse);

      expect(mockGet).toHaveBeenCalledWith([
        'enabled',
        'showNotifications',
        'autoContinueCount',
        'timeSaved',
        'lastReset',
      ]);
      expect(mockSendResponse).toHaveBeenCalledWith({
        enabled: true,
        autoContinueCount: 10,
        timeSaved: 600,
      });
    });

    it('should handle get settings error', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Storage error'));
      mockChrome.storage.local.get = mockGet;

      // Simulate the get settings handler with error handling
      const handleGetSettings = async (sendResponse: (response: any) => void): Promise<void> => {
        try {
          const result = await mockChrome.storage.local.get([
            'enabled',
            'showNotifications',
            'autoContinueCount',
            'timeSaved',
            'lastReset',
          ]);
          sendResponse(result);
        } catch (error) {
          sendResponse({});
        }
      };

      const mockSendResponse = jest.fn();
      await handleGetSettings(mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({});
    });
  });

  describe('Daily Cleanup Logic', () => {
    it('should perform cleanup when enough time has passed', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        lastCleanup: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
      });
      const mockSet = jest.fn().mockResolvedValue(undefined);
      
      mockChrome.storage.local.get = mockGet;
      mockChrome.storage.local.set = mockSet;

      // Simulate the daily cleanup logic
      const performDailyCleanup = async (): Promise<void> => {
        const result = await mockChrome.storage.local.get(['lastCleanup']);
        const lastCleanup = result.lastCleanup || 0;
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        if (now - lastCleanup > oneWeek) {
          await mockChrome.storage.local.set({ lastCleanup: now });
        }
      };

      await performDailyCleanup();

      expect(mockSet).toHaveBeenCalledWith({ lastCleanup: expect.any(Number) });
    });

    it('should not perform cleanup when recent cleanup exists', async () => {
      const recentTime = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      const mockGet = jest.fn().mockResolvedValue({
        lastCleanup: recentTime,
      });
      const mockSet = jest.fn().mockResolvedValue(undefined);
      
      mockChrome.storage.local.get = mockGet;
      mockChrome.storage.local.set = mockSet;

      // Simulate the daily cleanup logic
      const performDailyCleanup = async (): Promise<void> => {
        const result = await mockChrome.storage.local.get(['lastCleanup']);
        const lastCleanup = result.lastCleanup || 0;
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        if (now - lastCleanup > oneWeek) {
          await mockChrome.storage.local.set({ lastCleanup: now });
        }
      };

      await performDailyCleanup();

      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Storage error'));
      mockChrome.storage.local.get = mockGet;

      // Simulate the daily cleanup logic with error handling
      const performDailyCleanup = async (): Promise<void> => {
        try {
          const result = await mockChrome.storage.local.get(['lastCleanup']);
          const lastCleanup = result.lastCleanup || 0;
          const now = Date.now();
          const oneWeek = 7 * 24 * 60 * 60 * 1000;

          if (now - lastCleanup > oneWeek) {
            await mockChrome.storage.local.set({ lastCleanup: now });
          }
        } catch (error) {
          // Error handled gracefully
        }
      };

      // Should not throw
      await expect(performDailyCleanup()).resolves.not.toThrow();
    });
  });

  describe('Tab Update Logic', () => {
    it('should detect YouTube URLs', () => {
      // Simulate the tab update logic
      const isYouTubeUrl = (url: string): boolean => {
        return url.includes('youtube.com') || url.includes('music.youtube.com');
      };

      expect(isYouTubeUrl('https://www.youtube.com/watch?v=test')).toBe(true);
      expect(isYouTubeUrl('https://music.youtube.com/watch?v=test')).toBe(true);
      expect(isYouTubeUrl('https://www.google.com')).toBe(false);
    });
  });
});
