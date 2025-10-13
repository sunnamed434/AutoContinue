export const DEFAULT_CONFIG = {
  enabled: true,
  showNotifications: false,
  autoContinueCount: 0,
  timeSaved: 0,
  lastReset: Date.now(),
  idleTimeout: 5,
  autoClickDelay: 100,
  enableYouTubeMusic: true,
  testMode: false,
} as const;

export const CONFIG_VALIDATION = {
  enabled: (v: unknown) => typeof v === 'boolean',
  showNotifications: (v: unknown) => typeof v === 'boolean',
  autoContinueCount: (v: unknown) => typeof v === 'number' && v >= 0,
  timeSaved: (v: unknown) => typeof v === 'number' && v >= 0,
  lastReset: (v: unknown) => typeof v === 'number' && v > 0,
  idleTimeout: (v: unknown) => typeof v === 'number' && v >= 1 && v <= 60,
  autoClickDelay: (v: unknown) => typeof v === 'number' && v >= 0 && v <= 5000,
  enableYouTubeMusic: (v: unknown) => typeof v === 'boolean',
  testMode: (v: unknown) => typeof v === 'boolean',
} as const;
