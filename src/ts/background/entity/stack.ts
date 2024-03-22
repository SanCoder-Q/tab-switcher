import { Storage } from '../repo/storage';

type Stringifible = {
  toString(): string;
}

class StackInHouse<T extends Stringifible> {
  constructor(public version: number, public stack: T[]){}
}

export class Stack<T extends Stringifible> {
  private _stack: T[] = [];
  private _version: number = 0;
  private _storage: Storage<StackInHouse<T>> = new Storage<StackInHouse<T>>();
  private readonly _storageKey: string = "TAB_SWITCHER_TAB_STACK_DATA"

  constructor(public equals: (a: T, b: T) => boolean) {}

  async pop(): Promise<T | null> {
    await this._sync();
    const value = this._stack.pop() ?? null;
    this._bumpUp();
    console.debug('[DEBUG] popping', value?.toString(), 'from', this._stackToString(), 'version', this._version);
    await this._sync();
    return value;
  }

  async push(value: T): Promise<void> {
    await this._sync();
    this._stack.push(value);
    this._uniq();
    this._bumpUp();
    console.debug('[DEBUG] pushing', this._stackToString(), 'version', this._version);
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

  private _stackToString(): string {
    return '[' + this._stack.map(t => t.toString()).join(', ') + ']';
  }

  private async _sync(): Promise<void> {
    try {
      const store = await this._storage.get(this._storageKey);
      if (store.version < this._version) {
        await this._storage.set(this._storageKey, new StackInHouse<T>(this._version, this._stack));
      } else if (store.version > this._version) {
        console.log('[DEBUG] lost memory data, recovering from storage', this._version, '->', store.version);
        this._version = store.version;
        this._stack = store.stack;
      }
    } catch (e) {
      console.error('[ERROR] fail to sync with chrome storage', e);
    }
  }
}
