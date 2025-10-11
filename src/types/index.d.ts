// Chrome Extension API types
declare namespace chrome {
  namespace runtime {
    function getManifest(): chrome.runtime.Manifest;
    function getURL(path: string): string;
  }

  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | object): Promise<object>;
      set(items: object): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    const local: StorageArea;
    const sync: StorageArea;
  }

  namespace i18n {
    function getMessage(messageName: string, substitutions?: string | string[]): string;
  }
}

// YouTube-specific types
interface YouTubeVideoElement extends HTMLVideoElement {
  yns_pause?: () => void;
}

interface YouTubePopupEvent extends CustomEvent {
  detail: {
    nodeName: string;
  };
}

// Extension configuration
interface AutoContinueConfig {
  enabled: boolean;
  showNotifications: boolean;
  autoContinueCount: number;
  timeSaved: number;
  lastReset: number;
}

// Global variables for the extension
declare const AUTO_CONTINUE_VERSION: string;
declare const IS_YOUTUBE_MUSIC: boolean;
declare const IS_MOBILE_YOUTUBE: boolean;
