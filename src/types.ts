/**
 * Input data types accepted by compression/decompression functions.
 */
export type Data = Uint8Array | ArrayBuffer | string;

/**
 * Deflate/compress options (pako-compatible).
 */
export interface DeflateOptions {
  level?: number;
  windowBits?: number;
  memLevel?: number;
  strategy?: number;
  dictionary?: Uint8Array | ArrayBuffer;
  raw?: boolean;
  to?: 'string';
  chunkSize?: number;
  gzip?: boolean;
  header?: GzipHeader;
}

/**
 * Inflate/decompress options (pako-compatible).
 */
export interface InflateOptions {
  windowBits?: number;
  dictionary?: Uint8Array | ArrayBuffer;
  raw?: boolean;
  to?: 'string';
  chunkSize?: number;
}

/**
 * Gzip header fields.
 */
export interface GzipHeader {
  text?: boolean;
  time?: number;
  os?: number;
  extra?: Uint8Array;
  name?: string;
  comment?: string;
  hcrc?: boolean;
}
