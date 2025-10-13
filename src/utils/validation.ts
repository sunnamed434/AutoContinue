export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export function isYouTubeUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;

  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === 'www.youtube.com' ||
      parsedUrl.hostname === 'music.youtube.com' ||
      parsedUrl.hostname === 'm.youtube.com'
    );
  } catch {
    return false;
  }
}

export function isValidExtensionUrl(url: string): boolean {
  return url.startsWith('chrome-extension://') || url.startsWith('moz-extension://');
}

export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

export function validateConfigValue(key: string, value: unknown): boolean {
  const validators: Record<string, (value: unknown) => boolean> = {
    enabled: v => typeof v === 'boolean',
    showNotifications: v => typeof v === 'boolean',
    autoContinueCount: v => typeof v === 'number' && v >= 0,
    timeSaved: v => typeof v === 'number' && v >= 0,
    lastReset: v => typeof v === 'number' && v > 0,
    idleTimeout: v => typeof v === 'number' && v >= 1 && v <= 60,
    autoClickDelay: v => typeof v === 'number' && v >= 0 && v <= 5000,
    enableYouTubeMusic: v => typeof v === 'boolean',
    testMode: v => typeof v === 'boolean',
  };

  const validator = validators[key];
  return validator ? validator(value) : false;
}

export function validateMessage(message: unknown): message is Record<string, unknown> {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof (message as Record<string, unknown>)['action'] === 'string'
  );
}

export function validateStorageData(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null;
}
