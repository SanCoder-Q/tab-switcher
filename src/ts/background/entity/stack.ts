import { Storage } from '../repo/storage';

class StackInHouse<T> {
  constructor(public version: number, public stack: T[]){}
}

export class Stack<T> {
  private _stack: T[] = [];
  private _version: number = 0;
  private _storage: Storage<StackInHouse<T>> = new Storage<StackInHouse<T>>();
  private readonly _storageKey: string = "TAB_SWITCHER_TAB_STACK_DATA"

  constructor(public equals: (a: T, b: T) => boolean) {}

  async pop(): Promise<T | null> {
    const value = this._stack.pop() || null;
    this._bumpUp();
    await this._sync();
    return value;
  }

  async push(value: T): Promise<void> {
    this._stack.push(value);
    this._uniq();
    this._bumpUp();
    await this._sync();
  }

  peek(index: number = 0): T | null {
    return this._stack.at(this._stack.length - index - 1) || null;
  }

  private _uniq(): void {
    this._stack = this._stack.reduceRight<T[]>((acc, item) => {
      if (!acc.find(i => this.equals(item, i))) {
        acc.unshift(item);
      }
      return acc;
    }, []);
  }

  private _bumpUp(): void {
    this._version ++;
  }

  private async _sync(): Promise<void> {
    const store = await this._storage.get(this._storageKey);
    if (store.version < this._version) {
      await this._storage.set(this._storageKey, new StackInHouse<T>(this._version, this._stack));
    }
    else if (store.version > this._version) {
      this._version = store.version;
      this._stack = store.stack;
    }
  }
}
