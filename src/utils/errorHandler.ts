export interface ErrorContext {
  component: string;
  action: string;
  timestamp: number;
  userAgent: string;
  url?: string;
}

export class AutoContinueError extends Error {
  public readonly context: ErrorContext;
  public readonly isRecoverable: boolean;

  constructor(message: string, context: ErrorContext, isRecoverable = false) {
    super(message);
    this.name = 'AutoContinueError';
    this.context = context;
    this.isRecoverable = isRecoverable;
  }
}

export function createErrorContext(component: string, action: string, url?: string): ErrorContext {
  return {
    component,
    action,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: url || window.location?.href,
  };
}

export function handleError(error: unknown, context: ErrorContext): void {
  const autoContinueError =
    error instanceof AutoContinueError
      ? error
      : new AutoContinueError(
          error instanceof Error ? error.message : 'Unknown error',
          context,
          false
        );

  console.error(`[AutoContinue] ${context.component}:`, autoContinueError);

  if (!autoContinueError.isRecoverable) {
    console.error('[AutoContinue] Non-recoverable error detected:', autoContinueError.context);
  }
}

export function safeExecute<T>(fn: () => T, context: ErrorContext, fallback?: T): T | undefined {
  try {
    return fn();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}

export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  context: ErrorContext,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}
