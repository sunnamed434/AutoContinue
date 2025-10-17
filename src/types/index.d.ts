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
