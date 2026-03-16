import type { Data, InflateOptions } from '../types.js';
import { toUint8Array, uint8ArrayToString, concatUint8Arrays, resolveWindowBits } from '../utils.js';
import {
  Z_DEFAULT_WINDOWBITS,
  Z_FINISH,
  Z_NO_FLUSH,
  Z_OK,
  Z_STREAM_END,
} from '../constants.js';

type DSFormat = 'deflate' | 'deflate-raw' | 'gzip';

function pakoFormatToDS(format: 'deflate' | 'raw' | 'gzip'): DSFormat {
  if (format === 'raw') return 'deflate-raw';
  return format;
}

async function decompressWithDS(input: Uint8Array, dsFormat: DSFormat): Promise<Uint8Array> {
  const ds = new DecompressionStream(dsFormat);
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();

  const writePromise = writer.write(input as unknown as BufferSource).then(() => writer.close());
  const chunks: Uint8Array[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(new Uint8Array(value));
  }
  await writePromise;
  return concatUint8Arrays(chunks);
}

export async function inflate(input: Data, options?: InflateOptions): Promise<Uint8Array | string> {
  const buf = toUint8Array(input);
  const result = await decompressWithDS(buf, 'deflate');
  return options?.to === 'string' ? uint8ArrayToString(result) : result;
}

export async function inflateRaw(input: Data, options?: InflateOptions): Promise<Uint8Array | string> {
  const buf = toUint8Array(input);
  const result = await decompressWithDS(buf, 'deflate-raw');
  return options?.to === 'string' ? uint8ArrayToString(result) : result;
}

export async function ungzip(input: Data, options?: InflateOptions): Promise<Uint8Array | string> {
  const buf = toUint8Array(input);
  const result = await decompressWithDS(buf, 'gzip');
  return options?.to === 'string' ? uint8ArrayToString(result) : result;
}

export class Inflate {
  result: Uint8Array | null = null;
  err: number = Z_OK;
  msg: string = '';

  onData: ((chunk: Uint8Array) => void) | null = null;
  onEnd: ((status: number) => void) | null = null;

  private _options: InflateOptions;
  private _chunks: Uint8Array[] = [];
  private _dsFormat: DSFormat;

  constructor(options?: InflateOptions) {
    this._options = options ?? {};
    const windowBits = this._options.windowBits ?? Z_DEFAULT_WINDOWBITS;
    const { format } = resolveWindowBits(windowBits);
    this._dsFormat = pakoFormatToDS(format);
  }

  push(data: Data, flushMode?: number | boolean): boolean {
    const mode = flushMode === true ? Z_FINISH : (flushMode || Z_NO_FLUSH);
    const input = toUint8Array(data);

    this._chunks.push(input);

    if (mode === Z_FINISH) {
      const combined = concatUint8Arrays(this._chunks);
      decompressWithDS(combined, this._dsFormat).then((result) => {
        this.result = result;
        this.err = Z_OK;
        if (this.onData) this.onData(result);
        if (this.onEnd) this.onEnd(Z_OK);
      }).catch((e: unknown) => {
        this.err = Z_STREAM_END;
        this.msg = e instanceof Error ? e.message : 'decompression error';
        if (this.onEnd) this.onEnd(this.err);
      });
    }

    return true;
  }
}
