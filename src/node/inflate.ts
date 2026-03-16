import type { Data, InflateOptions } from '../types.js';

export function inflate(_input: Data, _options?: InflateOptions): Uint8Array {
  throw new Error('Not implemented');
}

export function inflateRaw(_input: Data, _options?: InflateOptions): Uint8Array {
  throw new Error('Not implemented');
}

export function ungzip(_input: Data, _options?: InflateOptions): Uint8Array {
  throw new Error('Not implemented');
}

export class Inflate {
  result: Uint8Array | null = null;
  err: number = 0;
  msg: string = '';

  constructor(_options?: InflateOptions) {
    throw new Error('Not implemented');
  }

  push(_data: Data, _flushMode?: number | boolean): boolean {
    throw new Error('Not implemented');
  }
}
