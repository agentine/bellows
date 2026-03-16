import type { Data } from './types.js';

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
