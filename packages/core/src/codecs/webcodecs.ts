import type { DMTCodecs } from './defs';

export interface DMTWebCodecsOptions { }

export class DMTWebCodecs implements DMTCodecs {
  constructor(_options: DMTWebCodecsOptions) { }

  async prepare(): Promise<void> { }

  static get supported(): boolean {
    return 'VideoEncoder' in window;
  }

  [Symbol.dispose](): void { }
}