/**
 * AutoContinue - Popup Tests
 * 
 * Tests the popup UI functionality and interactions
 */

describe('AutoContinue - Popup', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    jest.clearAllMocks();
    
    // Mock chrome APIs
    (global as any).chrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({
            enabled: true,
            autoContinueCount: 5,
            timeSaved: 25,
            lastReset: Date.now()
          }),
          set: jest.fn().mockResolvedValue(undefined)
        }
      },
      runtime: {
        getManifest: jest.fn(() => ({ version: '1.0.0' })),
        openOptionsPage: jest.fn()
      },
      tabs: {
        query: jest.fn().mockResolvedValue([{ id: 1 }]),
        sendMessage: jest.fn().mockResolvedValue(undefined)
      }
    };
  });

  describe('PopupController Initialization', () => {
    test('should initialize popup controller', () => {
      // Create popup HTML structure
      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle" checked>
          <span id="status-text">Enabled</span>
          <span id="continue-count">0</span>
          <span id="time-saved">0s</span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version">v0.0.0</span>
        </div>
      `;

      // Import and initialize popup controller
      const { PopupController } = require('../src/popup/popup');
      
      expect(() => new PopupController()).not.toThrow();
    });

    test('should load settings on initialization', async () => {
      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle">
          <span id="status-text"></span>
          <span id="continue-count"></span>
          <span id="time-saved"></span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version"></span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      const controller = new PopupController();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that chrome.storage.local.get was called
      expect(chrome.storage.local.get).toHaveBeenCalledWith([
        'enabled',
        'autoContinueCount',
        'timeSaved',
        'lastReset'
      ]);
    });
  });

  describe('UI Updates', () => {
    test('should update toggle state correctly', () => {
      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle">
          <span id="status-text"></span>
          <span id="continue-count"></span>
          <span id="time-saved"></span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version"></span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      const controller = new PopupController();

      // Test enabled state
      const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
      const statusText = document.getElementById('status-text') as HTMLElement;

      enabledToggle.checked = true;
      controller.updateStatusText(true);

      expect(statusText.textContent).toBe('Enabled');
      expect(statusText.className).toBe('');

      // Test disabled state
      enabledToggle.checked = false;
      controller.updateStatusText(false);

      expect(statusText.textContent).toBe('Disabled');
      expect(statusText.className).toBe('disabled');
    });

    test('should format time correctly', () => {
      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle">
          <span id="status-text"></span>
          <span id="continue-count"></span>
          <span id="time-saved"></span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version"></span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      const controller = new PopupController();

      // Test different time formats
      expect(controller.formatTime(30)).toBe('30s');
      expect(controller.formatTime(90)).toBe('1m');
      expect(controller.formatTime(3660)).toBe('1h 1m');
    });

    test('should update version from manifest', () => {
      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle">
          <span id="status-text"></span>
          <span id="continue-count"></span>
          <span id="time-saved"></span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version">v0.0.0</span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      const controller = new PopupController();

      const versionElement = document.querySelector('.version') as HTMLElement;
      expect(versionElement.textContent).toBe('v1.0.0');
    });
  });

  describe('Event Handlers', () => {
    test('should handle enable/disable toggle', async () => {
      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle" checked>
          <span id="status-text">Enabled</span>
          <span id="continue-count">0</span>
          <span id="time-saved">0s</span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version">v0.0.0</span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      const controller = new PopupController();

      const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;

      // Simulate toggle change
      enabledToggle.checked = false;
      enabledToggle.dispatchEvent(new Event('change'));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that storage was updated
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ enabled: false });
    });

    test('should handle reset stats button', async () => {
      // Mock confirm dialog
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle">
          <span id="status-text"></span>
          <span id="continue-count">5</span>
          <span id="time-saved">25s</span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version"></span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      const controller = new PopupController();

      const resetButton = document.getElementById('reset-stats') as HTMLButtonElement;

      // Simulate button click
      resetButton.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that confirm was called
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to reset all statistics?');

      // Check that storage was updated
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        autoContinueCount: 0,
        timeSaved: 0,
        lastReset: expect.any(Number)
      });

      confirmSpy.mockRestore();
    });

    test('should handle open options button', () => {
      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle">
          <span id="status-text"></span>
          <span id="continue-count">0</span>
          <span id="time-saved">0s</span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version"></span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      const controller = new PopupController();

      const optionsButton = document.getElementById('open-options') as HTMLButtonElement;

      // Simulate button click
      optionsButton.click();

      // Check that options page was opened
      expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      // Mock storage to throw error
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle">
          <span id="status-text"></span>
          <span id="continue-count">0</span>
          <span id="time-saved">0s</span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version"></span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      
      // Should not throw error
      expect(() => new PopupController()).not.toThrow();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load settings:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should handle tab communication errors', async () => {
      // Mock tabs.query to throw error
      chrome.tabs.query.mockRejectedValue(new Error('Tab error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      document.body.innerHTML = `
        <div class="container">
          <input type="checkbox" id="enabled-toggle" checked>
          <span id="status-text">Enabled</span>
          <span id="continue-count">0</span>
          <span id="time-saved">0s</span>
          <button id="reset-stats">Reset Stats</button>
          <button id="open-options">Settings</button>
          <span class="version"></span>
        </div>
      `;

      const { PopupController } = require('../src/popup/popup');
      const controller = new PopupController();

      const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;

      // Simulate toggle change
      enabledToggle.checked = false;
      enabledToggle.dispatchEvent(new Event('change'));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to notify content script:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
