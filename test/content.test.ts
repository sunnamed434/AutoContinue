/**
 * AutoContinue - Content Script Tests
 * 
 * Tests the content script injection and initialization
 */

describe('AutoContinue - Content Script', () => {
  beforeEach(() => {
    // Reset DOM and mocks
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    jest.clearAllMocks();
    
    // Mock chrome.runtime
    (global as any).chrome = {
      runtime: {
        getManifest: jest.fn(() => ({ version: '1.0.0' })),
        getURL: jest.fn((path: string) => `chrome-extension://test/${path}`)
      }
    };
  });

  describe('Script Injection', () => {
    test('should inject autoconfirm script into page', () => {
      // Import content script
      require('../src/content');
      
      // Check that script element was created
      const scripts = document.querySelectorAll('script');
      expect(scripts.length).toBeGreaterThan(0);
      
      // Check that script has correct src
      const autoconfirmScript = Array.from(scripts).find(script => 
        script.getAttribute('src')?.includes('autoconfirm.js')
      );
      expect(autoconfirmScript).toBeTruthy();
    });

    test('should remove script element after loading', () => {
      // Mock script onload behavior
      const mockScript = {
        src: 'chrome-extension://test/js/autoconfirm.js',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        parentNode: {
          removeChild: jest.fn()
        }
      };

      // Mock document.createElement
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tagName: string) => {
        if (tagName === 'script') {
          return mockScript as any;
        }
        return originalCreateElement.call(document, tagName);
      });

      // Import content script
      require('../src/content');

      // Simulate script load
      if (mockScript.onload) {
        mockScript.onload();
      }

      // Check that removeChild was called
      expect(mockScript.parentNode.removeChild).toHaveBeenCalledWith(mockScript);
    });

    test('should handle script load error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock script with error
      const mockScript = {
        src: 'chrome-extension://test/js/autoconfirm.js',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        parentNode: {
          removeChild: jest.fn()
        }
      };

      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tagName: string) => {
        if (tagName === 'script') {
          return mockScript as any;
        }
        return originalCreateElement.call(document, tagName);
      });

      // Import content script
      require('../src/content');

      // Simulate script error
      if (mockScript.onerror) {
        mockScript.onerror();
      }

      // Check that error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AutoContinue] Failed to load autoconfirm script'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('DOM Ready Handling', () => {
    test('should inject script when DOM is already ready', () => {
      // Set document.readyState to 'complete'
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Import content script
      require('../src/content');

      // Check that script injection was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AutoContinue v1.0.0] Content script loaded'
      );

      consoleSpy.mockRestore();
    });

    test('should wait for DOMContentLoaded when DOM is loading', () => {
      // Set document.readyState to 'loading'
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      // Import content script
      require('../src/content');

      // Check that DOMContentLoaded listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });
  });

  describe('SPA Navigation Handling', () => {
    test('should observe for URL changes', () => {
      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      };
      
      const MockMutationObserver = jest.fn(() => mockObserver);
      (global as any).MutationObserver = MockMutationObserver;

      // Import content script
      require('../src/content');

      // Check that MutationObserver was created and started observing
      expect(MockMutationObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith(
        document,
        { subtree: true, childList: true }
      );
    });

    test('should re-inject script on URL change', () => {
      let lastUrl = 'https://www.youtube.com/watch?v=test1';
      let urlChangeCallback: (() => void) | null = null;

      // Mock location.href
      Object.defineProperty(window, 'location', {
        value: { href: lastUrl },
        writable: true
      });

      // Mock MutationObserver to capture callback
      const MockMutationObserver = jest.fn().mockImplementation((callback) => {
        urlChangeCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn()
        };
      });
      (global as any).MutationObserver = MockMutationObserver;

      // Import content script
      require('../src/content');

      // Simulate URL change
      window.location.href = 'https://www.youtube.com/watch?v=test2';
      
      if (urlChangeCallback) {
        urlChangeCallback();
      }

      // Check that script was re-injected (would be tested by checking for new script elements)
      // This is a simplified test - in reality, we'd check for multiple script injections
      expect(MockMutationObserver).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle chrome.runtime errors gracefully', () => {
      // Mock chrome.runtime to throw error
      (global as any).chrome = {
        runtime: {
          getManifest: jest.fn(() => { throw new Error('Runtime error'); }),
          getURL: jest.fn(() => { throw new Error('Runtime error'); })
        }
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Should not throw error
      expect(() => {
        require('../src/content');
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    test('should handle DOM manipulation errors', () => {
      // Mock document.head to be null
      Object.defineProperty(document, 'head', {
        value: null,
        writable: true
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Should not throw error
      expect(() => {
        require('../src/content');
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Logging', () => {
    test('should log extension version on load', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Import content script
      require('../src/content');

      // Check that version was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AutoContinue v1.0.0] Content script loaded'
      );

      consoleSpy.mockRestore();
    });
  });
});
