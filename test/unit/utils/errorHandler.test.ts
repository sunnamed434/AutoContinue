import {
  AutoContinueError,
  createErrorContext,
  handleError,
  safeExecute,
  safeExecuteAsync,
} from '../../../src/utils/errorHandler';

describe('Error Handler Utils', () => {
  describe('AutoContinueError', () => {
    it('should create error with context', () => {
      const context = {
        component: 'test',
        action: 'testAction',
        timestamp: Date.now(),
        userAgent: 'test-agent',
        url: 'https://test.com',
      };

      const error = new AutoContinueError('Test error', context, true);

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AutoContinueError');
      expect(error.context).toEqual(context);
      expect(error.isRecoverable).toBe(true);
    });

    it('should default isRecoverable to false', () => {
      const context = createErrorContext('test', 'testAction');
      const error = new AutoContinueError('Test error', context);

      expect(error.isRecoverable).toBe(false);
    });
  });

  describe('createErrorContext', () => {
    it('should create context with required fields', () => {
      const context = createErrorContext('testComponent', 'testAction');

      expect(context.component).toBe('testComponent');
      expect(context.action).toBe('testAction');
      expect(typeof context.timestamp).toBe('number');
      expect(typeof context.userAgent).toBe('string');
    });

    it('should include URL when provided', () => {
      const context = createErrorContext('testComponent', 'testAction', 'https://test.com');

      expect(context.url).toBe('https://test.com');
    });

    it('should use window.location.href when URL not provided', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: 'https://window-location.com' },
        writable: true,
      });

      const context = createErrorContext('testComponent', 'testAction');

      expect(context.url).toBe('https://window-location.com');
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle AutoContinueError directly', () => {
      const context = createErrorContext('test', 'testAction');
      const error = new AutoContinueError('Test error', context, true);

      handleError(error, context);

      expect(console.error).toHaveBeenCalledWith('[AutoContinue] test:', error);
    });

    it('should wrap regular Error in AutoContinueError', () => {
      const context = createErrorContext('test', 'testAction');
      const regularError = new Error('Regular error');

      handleError(regularError, context);

      expect(console.error).toHaveBeenCalledWith('[AutoContinue] test:', expect.any(AutoContinueError));
    });

    it('should handle unknown error types', () => {
      const context = createErrorContext('test', 'testAction');
      const unknownError = 'String error';

      handleError(unknownError, context);

      expect(console.error).toHaveBeenCalledWith('[AutoContinue] test:', expect.any(AutoContinueError));
    });

    it('should log non-recoverable errors', () => {
      const context = createErrorContext('test', 'testAction');
      const error = new AutoContinueError('Test error', context, false);

      handleError(error, context);

      expect(console.error).toHaveBeenCalledWith('[AutoContinue] Non-recoverable error detected:', context);
    });
  });

  describe('safeExecute', () => {
    it('should execute function and return result', () => {
      const fn = jest.fn().mockReturnValue('success');
      const context = createErrorContext('test', 'testAction');

      const result = safeExecute(fn, context);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should return fallback on error', () => {
      const fn = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const context = createErrorContext('test', 'testAction');

      const result = safeExecute(fn, context, 'fallback');

      expect(result).toBe('fallback');
      expect(console.error).toHaveBeenCalled();
    });

    it('should return undefined when no fallback provided', () => {
      const fn = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const context = createErrorContext('test', 'testAction');

      const result = safeExecute(fn, context);

      expect(result).toBeUndefined();
    });
  });

  describe('safeExecuteAsync', () => {
    it('should execute async function and return result', async () => {
      const fn = jest.fn().mockResolvedValue('async success');
      const context = createErrorContext('test', 'testAction');

      const result = await safeExecuteAsync(fn, context);

      expect(result).toBe('async success');
      expect(fn).toHaveBeenCalled();
    });

    it('should return fallback on async error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Async error'));
      const context = createErrorContext('test', 'testAction');

      const result = await safeExecuteAsync(fn, context, 'async fallback');

      expect(result).toBe('async fallback');
      expect(console.error).toHaveBeenCalled();
    });

    it('should return undefined when no fallback provided', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Async error'));
      const context = createErrorContext('test', 'testAction');

      const result = await safeExecuteAsync(fn, context);

      expect(result).toBeUndefined();
    });
  });
});
