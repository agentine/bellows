import * as zlib from 'node:zlib';
import type { Data, InflateOptions } from '../types.js';
import { toUint8Array, uint8ArrayToString, concatUint8Arrays, resolveWindowBits } from '../utils.js';
import {
  Z_DEFAULT_WINDOWBITS,
  Z_FINISH,
  Z_NO_FLUSH,
  Z_OK,
  Z_STREAM_END,
} from '../constants.js';

function buildZlibOptions(options?: InflateOptions): zlib.ZlibOptions {
  const opts: zlib.ZlibOptions = {};
  if (options?.dictionary != null) {
    opts.dictionary = options.dictionary instanceof ArrayBuffer
      ? Buffer.from(options.dictionary)
      : Buffer.from(options.dictionary);
  }
  if (options?.chunkSize != null) opts.chunkSize = options.chunkSize;
  if (options?.windowBits != null) {
    const { bits } = resolveWindowBits(options.windowBits);
    opts.windowBits = bits;
  }
  return opts;
}

function maybeToString(result: Uint8Array, options?: InflateOptions): Uint8Array | string {
  if (options?.to === 'string') {
    return uint8ArrayToString(result);
  }
  return result;
}

export function inflate(input: Data, options?: InflateOptions & { to: 'string' }): string;
export function inflate(input: Data, options?: InflateOptions): Uint8Array;
export function inflate(input: Data, options?: InflateOptions): Uint8Array | string {
  const buf = toUint8Array(input);
  const zlibOpts = buildZlibOptions(options);
  const result = new Uint8Array(zlib.inflateSync(buf, zlibOpts));
  return maybeToString(result, options);
}

export function inflateRaw(input: Data, options?: InflateOptions & { to: 'string' }): string;
export function inflateRaw(input: Data, options?: InflateOptions): Uint8Array;
export function inflateRaw(input: Data, options?: InflateOptions): Uint8Array | string {
  const buf = toUint8Array(input);
  const zlibOpts = buildZlibOptions(options);
  const result = new Uint8Array(zlib.inflateRawSync(buf, zlibOpts));
  return maybeToString(result, options);
}

export function ungzip(input: Data, options?: InflateOptions & { to: 'string' }): string;
export function ungzip(input: Data, options?: InflateOptions): Uint8Array;
export function ungzip(input: Data, options?: InflateOptions): Uint8Array | string {
  const buf = toUint8Array(input);
  const zlibOpts = buildZlibOptions(options);
  const result = new Uint8Array(zlib.gunzipSync(buf, zlibOpts));
  return maybeToString(result, options);
}

export class Inflate {
  result: Uint8Array | null = null;
  err: number = Z_OK;
  msg: string = '';

  onData: ((chunk: Uint8Array) => void) | null = null;
  onEnd: ((status: number) => void) | null = null;

  private _options: InflateOptions;
  private _chunks: Uint8Array[] = [];

  constructor(options?: InflateOptions) {
    this._options = options ?? {};
  }

  push(data: Data, flushMode?: number | boolean): boolean {
    const mode = flushMode === true ? Z_FINISH : (flushMode || Z_NO_FLUSH);
    const input = toUint8Array(data);

    try {
      const windowBits = this._options.windowBits ?? Z_DEFAULT_WINDOWBITS;
      const { format } = resolveWindowBits(windowBits);
      const zlibOpts = buildZlibOptions(this._options);

      let decompressed: Buffer;
      switch (format) {
        case 'raw':
          decompressed = zlib.inflateRawSync(input, zlibOpts);
          break;
        case 'gzip':
          decompressed = zlib.gunzipSync(input, zlibOpts);
          break;
        default:
          decompressed = zlib.inflateSync(input, zlibOpts);
          break;
      }

      const chunk = new Uint8Array(decompressed);
      this._chunks.push(chunk);

      if (this.onData) {
        this.onData(chunk);
      }

      if (mode === Z_FINISH) {
        this.result = concatUint8Arrays(this._chunks);
        this.err = Z_OK;
        if (this.onEnd) {
          this.onEnd(Z_OK);
        }
      }

      return true;
    } catch (e: unknown) {
      this.err = Z_STREAM_END;
      this.msg = e instanceof Error ? e.message : 'decompression error';
      if (this.onEnd) {
        this.onEnd(this.err);
      }
      return false;
    }
  }
}
