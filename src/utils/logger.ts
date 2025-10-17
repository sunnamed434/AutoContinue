declare const __DEV__: boolean;

export const logger = {
  log: (...args: unknown[]): void => {
    if (__DEV__) {
      console.log(...args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (__DEV__) {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  info: (...args: unknown[]): void => {
    if (__DEV__) {
      console.info(...args);
    }
  },

  debug: (...args: unknown[]): void => {
    if (__DEV__) {
      console.debug(...args);
    }
  },
};
