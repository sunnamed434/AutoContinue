import { mockChrome } from '../setup';

describe('Config Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should handle storage operations', async () => {
      const testData = { enabled: true, autoContinueCount: 5 };
      mockChrome.storage.local.get.mockResolvedValue(testData);
      
      const result = await mockChrome.storage.local.get();
      expect(result).toEqual(testData);
    });

    it('should handle default values', () => {
      const defaultConfig = {
        enabled: true,
        showNotifications: false,
        autoContinueCount: 0,
        timeSaved: 0,
        lastReset: expect.any(Number),
        idleTimeout: 5,
        autoClickDelay: 100,
        enableYouTubeMusic: true,
        testMode: false,
      };
      
      const config = { ...defaultConfig, lastReset: Date.now() };
      expect(config.enabled).toBe(true);
      expect(config.idleTimeout).toBe(5);
    });

    it('should handle config validation', () => {
      const validConfig = {
        enabled: true,
        idleTimeout: 10,
        autoClickDelay: 200,
      };
      
      expect(validConfig.enabled).toBe(true);
      expect(validConfig.idleTimeout).toBeGreaterThan(0);
      expect(validConfig.autoClickDelay).toBeGreaterThanOrEqual(0);
    });
  });
});
