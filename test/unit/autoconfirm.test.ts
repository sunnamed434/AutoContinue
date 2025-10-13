import { isUserIdle, processInteraction, autoClickContinue, resetAutoContinueFlag } from '../../src/autoconfirm-simple';
import { dialogFactory, mockTimers } from '../helpers/mocks';

// We need to access the module's internal state for testing
// This is a bit of a hack, but necessary for testing the exported functions
jest.mock('../../src/autoconfirm-simple', () => {
  const originalModule = jest.requireActual('../../src/autoconfirm-simple');
  return {
    ...originalModule,
    // We'll test the exported functions directly
  };
});

describe('AutoConfirm Logic', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    jest.clearAllMocks();
    // Reset auto-continue flag to prevent test interference
    resetAutoContinueFlag();
  });

  describe('isUserIdle', () => {
    it('should return false when user is not idle', () => {
      // Since we can't directly access the module's lastInteractionTime,
      // we'll test the function by calling processInteraction first
      processInteraction();
      
      // Immediately check if idle (should be false)
      expect(isUserIdle()).toBe(false);
    });

    it('should return true when user is idle', () => {
      const timers = mockTimers();
      
      // Call processInteraction to set last interaction time
      processInteraction();
      
      // Advance time beyond idle timeout
      timers.advanceTimersByTime(6000); // 6 seconds, more than 5 second timeout
      
      expect(isUserIdle()).toBe(true);
      
      timers.restore();
    });

    it('should handle different idle timeouts', () => {
      const timers = mockTimers();
      
      processInteraction();
      
      // Test with 3 seconds (should not be idle with 5s timeout)
      timers.advanceTimersByTime(3000);
      expect(isUserIdle()).toBe(false);
      
      // Test with 6 seconds (should be idle with 5s timeout)
      timers.advanceTimersByTime(3000); // Total 6 seconds
      expect(isUserIdle()).toBe(true);
      
      timers.restore();
    });
  });

  describe('processInteraction', () => {
    it('should update last interaction time', () => {
      const timers = mockTimers();
      // const initialTime = Date.now();
      
      processInteraction();
      
      // Advance time and check that user is not idle
      timers.advanceTimersByTime(1000);
      expect(isUserIdle()).toBe(false);
      
      timers.restore();
    });

    it('should reset idle state', () => {
      const timers = mockTimers();
      
      // Make user idle
      processInteraction();
      timers.advanceTimersByTime(6000);
      expect(isUserIdle()).toBe(true);
      
      // Process interaction should reset idle state
      processInteraction();
      expect(isUserIdle()).toBe(false);
      
      timers.restore();
    });
  });

  describe('autoClickContinue', () => {
    it('should find and click continue button', () => {
      const dialog = dialogFactory.continueWatching();
      document.body.appendChild(dialog);
      
      const button = dialog.querySelector('button') as HTMLButtonElement;
      const clickSpy = jest.spyOn(button, 'click');
      
      const result = autoClickContinue();
      
      expect(result).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should try multiple selectors', () => {
      // Create a dialog with a button that matches the new specific selectors
      const dialog = document.createElement('yt-confirm-dialog-renderer');
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Continue watching');
      Object.defineProperty(button, 'offsetParent', { value: document.createElement('div'), writable: true }); // Make it visible
      dialog.appendChild(button);
      document.body.appendChild(dialog);
      
      const clickSpy = jest.spyOn(button, 'click');
      
      const result = autoClickContinue();
      
      expect(result).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should not click disabled buttons', () => {
      const dialog = dialogFactory.disabledButton();
      document.body.appendChild(dialog);
      
      const button = dialog.querySelector('button') as HTMLButtonElement;
      const clickSpy = jest.spyOn(button, 'click');
      
      const result = autoClickContinue();
      
      expect(result).toBe(false);
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('should not click hidden buttons', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Continue watching');
      Object.defineProperty(button, 'offsetParent', { value: null, writable: true }); // Make it hidden
      document.body.appendChild(button);
      
      const clickSpy = jest.spyOn(button, 'click');
      
      const result = autoClickContinue();
      
      expect(result).toBe(false);
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('should return false when no button found', () => {
      // Empty DOM
      document.body.innerHTML = '';
      
      const result = autoClickContinue();
      
      expect(result).toBe(false);
    });

    it('should handle YouTube Music dialogs', () => {
      const dialog = dialogFactory.musicDialog();
      document.body.appendChild(dialog);
      
      const button = dialog.querySelector('button') as HTMLButtonElement;
      const clickSpy = jest.spyOn(button, 'click');
      
      const result = autoClickContinue();
      
      expect(result).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should try all selectors in order', () => {
      // Create multiple dialogs with different button selectors
      const dialog1 = document.createElement('yt-confirm-dialog-renderer');
      const button1 = document.createElement('button');
      button1.setAttribute('aria-label', 'Continue watching');
      Object.defineProperty(button1, 'offsetParent', { value: document.createElement('div'), writable: true });
      dialog1.appendChild(button1);
      
      const dialog2 = document.createElement('ytmusic-you-there-renderer');
      const button2 = document.createElement('button');
      button2.setAttribute('aria-label', 'Continue');
      Object.defineProperty(button2, 'offsetParent', { value: document.createElement('div'), writable: true });
      dialog2.appendChild(button2);
      
      document.body.appendChild(dialog1);
      document.body.appendChild(dialog2);
      
      const clickSpy1 = jest.spyOn(button1, 'click');
      const clickSpy2 = jest.spyOn(button2, 'click');
      
      const result = autoClickContinue();
      
      expect(result).toBe(true);
      // Should click the first matching button (button1)
      expect(clickSpy1).toHaveBeenCalled();
      expect(clickSpy2).not.toHaveBeenCalled();
    });
  });
});
