const { tabs, storage, commands, windows } = chrome;

export class Storage<T> {
  get(key: string): Promise<T> {
    return storage.local.get([key]).then(data => data[key] as T);
  }

  set(key: string, value: T): Promise<void> {
    return storage.local.set({ [key]: value });
  }
}
