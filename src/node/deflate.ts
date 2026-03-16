import type { Data, DeflateOptions } from '../types.js';

export function deflate(_input: Data, _options?: DeflateOptions): Uint8Array {
  throw new Error('Not implemented');
}

export function deflateRaw(_input: Data, _options?: DeflateOptions): Uint8Array {
  throw new Error('Not implemented');
}

export function gzip(_input: Data, _options?: DeflateOptions): Uint8Array {
  throw new Error('Not implemented');
}

export class Deflate {
  result: Uint8Array | null = null;
  err: number = 0;
  msg: string = '';

  constructor(_options?: DeflateOptions) {
    throw new Error('Not implemented');
  }

  push(_data: Data, _flushMode?: number | boolean): boolean {
    throw new Error('Not implemented');
  }
}
