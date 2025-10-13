import {
  isValidUrl,
  isYouTubeUrl,
  isValidExtensionUrl,
  sanitizeHtml,
  validateConfigValue,
  validateMessage,
  validateStorageData,
} from '../../../src/utils/validation';

describe('Validation Utils', () => {
  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://www.youtube.com/watch?v=test')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('://example.com')).toBe(false);
    });
  });

  describe('isYouTubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=test')).toBe(true);
      expect(isYouTubeUrl('https://music.youtube.com/watch?v=test')).toBe(true);
      expect(isYouTubeUrl('https://m.youtube.com/watch?v=test')).toBe(true);
    });

    it('should return false for non-YouTube URLs', () => {
      expect(isYouTubeUrl('https://www.google.com')).toBe(false);
      expect(isYouTubeUrl('https://example.com')).toBe(false);
      expect(isYouTubeUrl('http://youtube.com')).toBe(false); // HTTP not HTTPS
    });

    it('should return false for invalid URLs', () => {
      expect(isYouTubeUrl('not-a-url')).toBe(false);
      expect(isYouTubeUrl('')).toBe(false);
    });
  });

  describe('isValidExtensionUrl', () => {
    it('should return true for valid extension URLs', () => {
      expect(isValidExtensionUrl('chrome-extension://abc123/')).toBe(true);
      expect(isValidExtensionUrl('moz-extension://abc123/')).toBe(true);
    });

    it('should return false for non-extension URLs', () => {
      expect(isValidExtensionUrl('https://example.com')).toBe(false);
      expect(isValidExtensionUrl('http://example.com')).toBe(false);
      expect(isValidExtensionUrl('file:///path/to/file')).toBe(false);
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML characters', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(sanitizeHtml('Hello <b>World</b>')).toBe('Hello &lt;b&gt;World&lt;/b&gt;');
    });

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle plain text', () => {
      expect(sanitizeHtml('Plain text')).toBe('Plain text');
    });
  });

  describe('validateConfigValue', () => {
    it('should validate enabled field correctly', () => {
      expect(validateConfigValue('enabled', true)).toBe(true);
      expect(validateConfigValue('enabled', false)).toBe(true);
      expect(validateConfigValue('enabled', 'true')).toBe(false);
      expect(validateConfigValue('enabled', 1)).toBe(false);
    });

    it('should validate autoContinueCount field correctly', () => {
      expect(validateConfigValue('autoContinueCount', 0)).toBe(true);
      expect(validateConfigValue('autoContinueCount', 100)).toBe(true);
      expect(validateConfigValue('autoContinueCount', -1)).toBe(false);
      expect(validateConfigValue('autoContinueCount', '100')).toBe(false);
    });

    it('should validate idleTimeout field correctly', () => {
      expect(validateConfigValue('idleTimeout', 1)).toBe(true);
      expect(validateConfigValue('idleTimeout', 30)).toBe(true);
      expect(validateConfigValue('idleTimeout', 60)).toBe(true);
      expect(validateConfigValue('idleTimeout', 0)).toBe(false);
      expect(validateConfigValue('idleTimeout', 61)).toBe(false);
    });

    it('should validate autoClickDelay field correctly', () => {
      expect(validateConfigValue('autoClickDelay', 0)).toBe(true);
      expect(validateConfigValue('autoClickDelay', 100)).toBe(true);
      expect(validateConfigValue('autoClickDelay', 5000)).toBe(true);
      expect(validateConfigValue('autoClickDelay', -1)).toBe(false);
      expect(validateConfigValue('autoClickDelay', 5001)).toBe(false);
    });

    it('should return false for unknown fields', () => {
      expect(validateConfigValue('unknownField', 'value')).toBe(false);
      expect(validateConfigValue('', 'value')).toBe(false);
    });
  });

  describe('validateMessage', () => {
    it('should validate valid messages', () => {
      expect(validateMessage({ action: 'toggle' })).toBe(true);
      expect(validateMessage({ action: 'updateStats', data: {} })).toBe(true);
    });

    it('should reject invalid messages', () => {
      expect(validateMessage({})).toBe(false);
      expect(validateMessage({ action: 123 })).toBe(false);
      expect(validateMessage('not an object')).toBe(false);
      expect(validateMessage(null)).toBe(false);
      expect(validateMessage(undefined)).toBe(false);
    });
  });

  describe('validateStorageData', () => {
    it('should validate valid storage data', () => {
      expect(validateStorageData({})).toBe(true);
      expect(validateStorageData({ key: 'value' })).toBe(true);
      expect(validateStorageData({ enabled: true, count: 0 })).toBe(true);
    });

    it('should reject invalid storage data', () => {
      expect(validateStorageData(null)).toBe(false);
      expect(validateStorageData(undefined)).toBe(false);
      expect(validateStorageData('string')).toBe(false);
      expect(validateStorageData(123)).toBe(false);
    });
  });
});
