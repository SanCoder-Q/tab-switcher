export class ControlledTab {
  constructor(public tabId: number, public windowId: number) {}

  toString() {
    return `${ this.windowId }-${ this.tabId }`;
  }
}
