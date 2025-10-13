import { createMockVideo, createMockStorage, createMockTab, createMockMessage, createMockCustomEvent } from '../setup';
export const videoElementFactory = {
  standard: () => {
    const video = createMockVideo({
      duration: 300,
      offsetWidth: 1280,
      offsetHeight: 720,
      paused: false,
    });
    video.classList.add = jest.fn();
    video.classList.remove = jest.fn();
    video.classList.toggle = jest.fn();
    video.classList.item = jest.fn();
    Object.defineProperty(video.classList, 'length', { value: 1, writable: true });
    Object.defineProperty(video.classList, 'value', { value: 'mock-class', writable: true });
    return video;
  },

  hidden: () => {
    const video = createMockVideo({
      duration: 300,
      offsetWidth: 0,
      offsetHeight: 0,
      paused: false,
    });
    video.classList.add = jest.fn();
    video.classList.remove = jest.fn();
    video.classList.toggle = jest.fn();
    video.classList.item = jest.fn();
    Object.defineProperty(video.classList, 'length', { value: 1, writable: true });
    Object.defineProperty(video.classList, 'value', { value: 'mock-class', writable: true });
    return video;
  },

  noDuration: () => {
    const video = createMockVideo({
      duration: 0,
      offsetWidth: 1280,
      offsetHeight: 720,
      paused: false,
    });
    video.classList.add = jest.fn();
    video.classList.remove = jest.fn();
    video.classList.toggle = jest.fn();
    video.classList.item = jest.fn();
    Object.defineProperty(video.classList, 'length', { value: 1, writable: true });
    Object.defineProperty(video.classList, 'value', { value: 'mock-class', writable: true });
    return video;
  },

  paused: () => createMockVideo({
    duration: 300,
    offsetWidth: 1280,
    offsetHeight: 720,
    paused: true,
  }),

  mobile: () => createMockVideo({
    duration: 300,
    offsetWidth: 375,
    offsetHeight: 211,
    paused: false,
    id: 'player_html5_api',
  }),
};

export const dialogFactory = {
  continueWatching: () => {
    const dialog = document.createElement('yt-confirm-dialog-renderer');
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Continue watching');
    button.id = 'confirm-button';
    Object.defineProperty(button, 'offsetParent', { value: document.createElement('div'), writable: true });
    dialog.appendChild(button);
    return dialog;
  },

  withCustomButton: (selector: string, label: string) => {
    const dialog = document.createElement('yt-confirm-dialog-renderer');
    const button = document.createElement('button');
    button.setAttribute('aria-label', label);
    button.className = selector;
    Object.defineProperty(button, 'offsetParent', { value: document.createElement('div'), writable: true });
    dialog.appendChild(button);
    return dialog;
  },

  musicDialog: () => {
    const dialog = document.createElement('ytmusic-you-there-renderer');
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Continue');
    Object.defineProperty(button, 'offsetParent', { value: document.createElement('div'), writable: true });
    dialog.appendChild(button);
    return dialog;
  },

  disabledButton: () => {
    const dialog = document.createElement('yt-confirm-dialog-renderer');
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Continue watching');
    button.disabled = true;
    Object.defineProperty(button, 'offsetParent', { value: document.createElement('div'), writable: true });
    dialog.appendChild(button);
    return dialog;
  },
};

export const storageFactory = {
  enabled: () => createMockStorage({
    enabled: true,
    idleTimeout: 5,
    autoClickDelay: 100,
  }),

  disabled: () => createMockStorage({
    enabled: false,
    idleTimeout: 5,
    autoClickDelay: 100,
  }),

  customTimeout: (timeout: number) => createMockStorage({
    enabled: true,
    idleTimeout: timeout,
    autoClickDelay: 100,
  }),

  withStats: (count: number, timeSaved: number) => createMockStorage({
    enabled: true,
    autoContinueCount: count,
    timeSaved: timeSaved,
    lastReset: Date.now() - 86400000,
  }),

  testMode: () => createMockStorage({
    enabled: true,
    testMode: true,
    idleTimeout: 5,
  }),
};

export const tabFactory = {
  youtube: () => createMockTab({
    id: 1,
    url: 'https://www.youtube.com/watch?v=test123',
    active: true,
  }),

  youtubeMusic: () => createMockTab({
    id: 2,
    url: 'https://music.youtube.com/watch?v=test123',
    active: true,
  }),

  nonYouTube: () => createMockTab({
    id: 3,
    url: 'https://www.google.com',
    active: true,
  }),

  mobileYouTube: () => createMockTab({
    id: 4,
    url: 'https://m.youtube.com/watch?v=test123',
    active: true,
  }),
};

export const messageFactory = {
  toggle: (enabled: boolean) => createMockMessage('toggle', { enabled }),

  updateStats: (count: number, timeSaved: number) => createMockMessage('updateStats', {
    stats: { autoContinueCount: count, timeSaved },
  }),

  getSettings: () => createMockMessage('getSettings'),

  testPopup: () => createMockMessage('testPopup'),

  testNativePopup: () => createMockMessage('testNativePopup'),

  checkVideo: () => createMockMessage('checkVideo'),
};

export const eventFactory = {
  popupOpened: (nodeName: string = 'YT-CONFIRM-DIALOG-RENDERER') => 
    createMockCustomEvent('yt-popup-opened', { nodeName }),

  settingsUpdated: (settings: Record<string, any>) => 
    createMockCustomEvent('autocontinue-settings-updated', settings),

  domContentLoaded: () => new Event('DOMContentLoaded'),

  userInteraction: (type: string = 'mousedown') => new Event(type),
};

export const setupDOMWithVideo = (videoConfig: any = {}) => {
  const video = videoElementFactory.standard();
  Object.assign(video, videoConfig);
  document.body.appendChild(video);
  return video;
};

export const setupDOMWithDialog = (dialogConfig: any = {}) => {
  const dialog = dialogFactory.continueWatching();
  Object.assign(dialog, dialogConfig);
  document.body.appendChild(dialog);
  return dialog;
};

export const createMockElement = (tagName: string, properties: Record<string, any> = {}): HTMLElement => {
  const element = document.createElement(tagName);
  Object.assign(element, properties);
  return element;
};

export const mockGetBoundingClientRect = (element: HTMLElement, rect: Partial<DOMRect> = {}) => {
  const defaultRect: DOMRect = {
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  };
  
  element.getBoundingClientRect = jest.fn().mockReturnValue({ ...defaultRect, ...rect });
};

export const mockElementFromPoint = (element: HTMLElement | null) => {
  document.elementFromPoint = jest.fn().mockReturnValue(element);
};

export const createMockMutationObserver = () => {
  const mockObserver = {
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn().mockReturnValue([]),
  };
  
  (global as any).MutationObserver = jest.fn().mockImplementation(() => mockObserver);
  return mockObserver;
};

export const mockTimers = () => {
  jest.useFakeTimers();
  return {
    advanceTimersByTime: (ms: number) => jest.advanceTimersByTime(ms),
    runAllTimers: () => jest.runAllTimers(),
    restore: () => jest.useRealTimers(),
  };
};
