export class Strategy {
  constructor(public readonly match: (command: string) => boolean, public readonly execute: () => Promise<void>) {}
}
