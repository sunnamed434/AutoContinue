import { formatTime, formatDate } from '../../../src/utils/formatters';

describe('Formatters Utils', () => {
  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(0)).toBe('0s');
      expect(formatTime(30)).toBe('30s');
      expect(formatTime(59)).toBe('59s');
    });

    it('should format minutes correctly', () => {
      expect(formatTime(60)).toBe('1m');
      expect(formatTime(90)).toBe('1m');
      expect(formatTime(120)).toBe('2m');
      expect(formatTime(3599)).toBe('59m');
    });

    it('should format hours and minutes correctly', () => {
      expect(formatTime(3600)).toBe('1h 0m');
      expect(formatTime(3660)).toBe('1h 1m');
      expect(formatTime(3720)).toBe('1h 2m');
      expect(formatTime(7200)).toBe('2h 0m');
      expect(formatTime(7260)).toBe('2h 1m');
    });

    it('should handle edge cases', () => {
      expect(formatTime(0.5)).toBe('0.5s'); // Shows decimal for fractional seconds
      expect(formatTime(60.9)).toBe('1m'); // Should floor
      expect(formatTime(3600.9)).toBe('1h 0m'); // Should floor
    });
  });

  describe('formatDate', () => {
    const mockNow = new Date('2023-12-25T12:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockNow);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format today correctly', () => {
      const today = mockNow.getTime();
      expect(formatDate(today)).toBe('Today');
    });

    it('should format yesterday correctly', () => {
      const yesterday = mockNow.getTime() - 24 * 60 * 60 * 1000;
      expect(formatDate(yesterday)).toBe('Yesterday');
    });

    it('should format days ago correctly', () => {
      const twoDaysAgo = mockNow.getTime() - 2 * 24 * 60 * 60 * 1000;
      expect(formatDate(twoDaysAgo)).toBe('2 days ago');

      const sixDaysAgo = mockNow.getTime() - 6 * 24 * 60 * 60 * 1000;
      expect(formatDate(sixDaysAgo)).toBe('6 days ago');
    });

    it('should format dates older than a week', () => {
      const eightDaysAgo = mockNow.getTime() - 8 * 24 * 60 * 60 * 1000;
      const expectedDate = new Date(eightDaysAgo).toLocaleDateString();
      expect(formatDate(eightDaysAgo)).toBe(expectedDate);

      const oneMonthAgo = mockNow.getTime() - 30 * 24 * 60 * 60 * 1000;
      const expectedMonthDate = new Date(oneMonthAgo).toLocaleDateString();
      expect(formatDate(oneMonthAgo)).toBe(expectedMonthDate);
    });

    it('should handle edge cases', () => {
      // Test with exact 7 days (should show as date, not "7 days ago")
      const sevenDaysAgo = mockNow.getTime() - 7 * 24 * 60 * 60 * 1000;
      const expectedDate = new Date(sevenDaysAgo).toLocaleDateString();
      expect(formatDate(sevenDaysAgo)).toBe(expectedDate);
    });
  });
});
