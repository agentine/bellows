import * as zlib from 'node:zlib';
import type { Data, DeflateOptions } from '../types.js';
import { toUint8Array, uint8ArrayToString, concatUint8Arrays, resolveWindowBits } from '../utils.js';
import {
  Z_DEFAULT_WINDOWBITS,
  Z_FINISH,
  Z_NO_FLUSH,
  Z_OK,
  Z_STREAM_END,
} from '../constants.js';

function buildZlibOptions(options?: DeflateOptions): zlib.ZlibOptions {
  const opts: zlib.ZlibOptions = {};
  if (options?.level != null) opts.level = options.level;
  if (options?.memLevel != null) opts.memLevel = options.memLevel;
  if (options?.strategy != null) opts.strategy = options.strategy;
  if (options?.dictionary != null) {
    opts.dictionary = options.dictionary instanceof ArrayBuffer
      ? Buffer.from(options.dictionary)
      : Buffer.from(options.dictionary);
  }
  if (options?.chunkSize != null) opts.chunkSize = options.chunkSize;
  if (options?.windowBits != null) {
    // For the generic case, resolve absolute windowBits for the zlib option
    const { bits } = resolveWindowBits(options.windowBits);
    opts.windowBits = bits;
  }
  return opts;
}

function maybeToString(result: Uint8Array, options?: DeflateOptions): Uint8Array | string {
  if (options?.to === 'string') {
    return uint8ArrayToString(result);
  }
  return result;
}

export function deflate(input: Data, options?: DeflateOptions & { to: 'string' }): string;
export function deflate(input: Data, options?: DeflateOptions): Uint8Array;
export function deflate(input: Data, options?: DeflateOptions): Uint8Array | string {
  const buf = toUint8Array(input);
  const zlibOpts = buildZlibOptions(options);
  const result = new Uint8Array(zlib.deflateSync(buf, zlibOpts));
  return maybeToString(result, options);
}

export function deflateRaw(input: Data, options?: DeflateOptions & { to: 'string' }): string;
export function deflateRaw(input: Data, options?: DeflateOptions): Uint8Array;
export function deflateRaw(input: Data, options?: DeflateOptions): Uint8Array | string {
  const buf = toUint8Array(input);
  const zlibOpts = buildZlibOptions(options);
  const result = new Uint8Array(zlib.deflateRawSync(buf, zlibOpts));
  return maybeToString(result, options);
}

export function gzip(input: Data, options?: DeflateOptions & { to: 'string' }): string;
export function gzip(input: Data, options?: DeflateOptions): Uint8Array;
export function gzip(input: Data, options?: DeflateOptions): Uint8Array | string {
  const buf = toUint8Array(input);
  const zlibOpts = buildZlibOptions(options);
  const result = new Uint8Array(zlib.gzipSync(buf, zlibOpts));
  return maybeToString(result, options);
}

export class Deflate {
  result: Uint8Array | null = null;
  err: number = Z_OK;
  msg: string = '';

  onData: ((chunk: Uint8Array) => void) | null = null;
  onEnd: ((status: number) => void) | null = null;

  private _options: DeflateOptions;
  private _chunks: Uint8Array[] = [];

  constructor(options?: DeflateOptions) {
    this._options = options ?? {};
  }

  push(data: Data, flushMode?: number | boolean): boolean {
    const mode = flushMode === true ? Z_FINISH : (flushMode || Z_NO_FLUSH);
    const input = toUint8Array(data);

    try {
      // Determine format from options
      const windowBits = this._options.windowBits ?? Z_DEFAULT_WINDOWBITS;
      const { format } = resolveWindowBits(windowBits);
      const zlibOpts = buildZlibOptions(this._options);

      let compressed: Buffer;
      switch (format) {
        case 'raw':
          compressed = zlib.deflateRawSync(input, zlibOpts);
          break;
        case 'gzip':
          compressed = zlib.gzipSync(input, zlibOpts);
          break;
        default:
          compressed = zlib.deflateSync(input, zlibOpts);
          break;
      }

      const chunk = new Uint8Array(compressed);
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
      this.msg = e instanceof Error ? e.message : 'compression error';
      if (this.onEnd) {
        this.onEnd(this.err);
      }
      return false;
    }
  }
}
