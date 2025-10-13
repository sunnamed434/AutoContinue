import 'jest-environment-jsdom';
const mockChrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      getListeners: jest.fn().mockReturnValue([]),
    },
  },
  runtime: {
    getManifest: jest.fn().mockReturnValue({
      version: '1.0.0',
      name: 'AutoContinue',
    }),
    getURL: jest.fn().mockImplementation((path: string) => `chrome-extension://test-id/${path}`),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onInstalled: {
      addListener: jest.fn(),
    },
    onMessage: {
      addListener: jest.fn(),
    },
    openOptionsPage: jest.fn().mockResolvedValue(undefined),
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://www.youtube.com/watch?v=test' }]),
    sendMessage: jest.fn().mockResolvedValue({}),
    reload: jest.fn().mockResolvedValue(undefined),
    onUpdated: {
      addListener: jest.fn(),
    },
  },
  action: {
    onClicked: {
      addListener: jest.fn(),
    },
  },
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
  scripting: {
    executeScript: jest.fn().mockResolvedValue(undefined),
  },
};

(global as any).chrome = mockChrome;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  jest.clearAllMocks();
  
  mockChrome.storage.local.get.mockResolvedValue({});
  mockChrome.storage.local.set.mockResolvedValue(undefined);
  
  document.elementFromPoint = jest.fn().mockReturnValue(null);
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://www.youtube.com/watch?v=test',
      hostname: 'www.youtube.com',
      pathname: '/watch'
    },
    writable: true
  });
});

export const createMockVideo = (overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement => {
  const video = document.createElement('video');
  
  Object.defineProperty(video, 'duration', { value: overrides.duration || 120, writable: true });
  Object.defineProperty(video, 'offsetWidth', { value: overrides.offsetWidth || 640, writable: true });
  Object.defineProperty(video, 'offsetHeight', { value: overrides.offsetHeight || 360, writable: true });
  Object.defineProperty(video, 'paused', { value: overrides.paused || false, writable: true });
  
  if (overrides.classList) {
    Object.defineProperty(video, 'classList', { value: overrides.classList, writable: true });
  } else {
    Object.defineProperty(video, 'classList', { 
      value: { 
        contains: jest.fn().mockReturnValue(true),
        add: jest.fn(),
        remove: jest.fn(),
        toggle: jest.fn(),
        item: jest.fn(),
        length: 1,
        value: 'mock-class'
      }, 
      writable: true 
    });
  }
  
  Object.assign(video, overrides);
  
  return video;
};

export const createMockYouTubeDialog = (): HTMLElement => {
  const dialog = document.createElement('yt-confirm-dialog-renderer');
  const button = document.createElement('button');
  button.setAttribute('aria-label', 'Continue watching');
  button.id = 'confirm-button';
  dialog.appendChild(button);
  return dialog;
};

export const createMockStorage = (overrides: Record<string, any> = {}) => {
  const defaultStorage = {
    enabled: true,
    showNotifications: false,
    autoContinueCount: 0,
    timeSaved: 0,
    lastReset: Date.now(),
    idleTimeout: 5,
    autoClickDelay: 100,
    enableYouTubeMusic: true,
    testMode: false,
  };
  
  return { ...defaultStorage, ...overrides };
};

export const mockChromeStorage = (data: Record<string, any>) => {
  mockChrome.storage.local.get.mockResolvedValue(data);
};

export const createMockTab = (overrides: any = {}): any => ({
  id: 1,
  url: 'https://www.youtube.com/watch?v=test',
  active: true,
  ...overrides,
});

export const createMockMessage = (action: string, data: any = {}): any => ({
  action,
  ...data,
});

export const createMockCustomEvent = (type: string, detail: any = {}): CustomEvent => {
  return new CustomEvent(type, { detail });
};

export { mockChrome };
