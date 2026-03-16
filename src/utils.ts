import type { Data } from './types.js';
import { Z_DEFAULT_WINDOWBITS } from './constants.js';

/**
 * Convert input data to Uint8Array.
 */
export function toUint8Array(data: Data): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }
  throw new TypeError('Unsupported input type');
}

/**
 * Convert Uint8Array to string (UTF-8).
 */
export function uint8ArrayToString(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

/**
 * Concatenate multiple Uint8Arrays into one.
 */
export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Compression format as determined by windowBits.
 */
export type ZlibFormat = 'deflate' | 'raw' | 'gzip';

/**
 * Resolve windowBits to a compression format and absolute windowBits value.
 *
 * pako convention:
 *   8..15        -> zlib (deflate) format
 *  -8..-15       -> raw deflate (no header/trailer)
 *  24..31 (16+x) -> gzip format
 */
export function resolveWindowBits(windowBits?: number): { format: ZlibFormat; bits: number } {
  const wb = windowBits ?? Z_DEFAULT_WINDOWBITS;
  if (wb >= 16 + 8 && wb <= 16 + 15) {
    return { format: 'gzip', bits: wb - 16 };
  }
  if (wb >= -15 && wb <= -8) {
    return { format: 'raw', bits: -wb };
  }
  if (wb >= 8 && wb <= 15) {
    return { format: 'deflate', bits: wb };
  }
  throw new RangeError(`Invalid windowBits: ${wb}`);
}
