const { tabs, storage, commands, windows } = chrome;

export class Storage<T> {
  get(key: string): Promise<T> {
    return new Promise<T>((resolve) => {
      storage.local.get(key, (value) => resolve(value as T));
    });
  }

  set(key: string, value: T): Promise<void> {
    return new Promise<void>((resolve => {
      storage.local.set({ [key]: value }, resolve);
    }));
  }
}
