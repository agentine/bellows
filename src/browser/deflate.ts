import type { Data, DeflateOptions } from '../types.js';
import { toUint8Array, uint8ArrayToString, concatUint8Arrays, resolveWindowBits } from '../utils.js';
import {
  Z_DEFAULT_WINDOWBITS,
  Z_FINISH,
  Z_NO_FLUSH,
  Z_OK,
  Z_STREAM_END,
} from '../constants.js';

type CSFormat = 'deflate' | 'deflate-raw' | 'gzip';

function pakoFormatToCS(format: 'deflate' | 'raw' | 'gzip'): CSFormat {
  if (format === 'raw') return 'deflate-raw';
  return format;
}

async function compressWithCS(input: Uint8Array, csFormat: CSFormat): Promise<Uint8Array> {
  const cs = new CompressionStream(csFormat);
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();

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

export async function deflate(input: Data, options?: DeflateOptions): Promise<Uint8Array | string> {
  const buf = toUint8Array(input);
  const result = await compressWithCS(buf, 'deflate');
  return options?.to === 'string' ? uint8ArrayToString(result) : result;
}

export async function deflateRaw(input: Data, options?: DeflateOptions): Promise<Uint8Array | string> {
  const buf = toUint8Array(input);
  const result = await compressWithCS(buf, 'deflate-raw');
  return options?.to === 'string' ? uint8ArrayToString(result) : result;
}

export async function gzip(input: Data, options?: DeflateOptions): Promise<Uint8Array | string> {
  const buf = toUint8Array(input);
  const result = await compressWithCS(buf, 'gzip');
  return options?.to === 'string' ? uint8ArrayToString(result) : result;
}

export class Deflate {
  result: Uint8Array | null = null;
  err: number = Z_OK;
  msg: string = '';

  onData: ((chunk: Uint8Array) => void) | null = null;
  onEnd: ((status: number) => void) | null = null;

  private _options: DeflateOptions;
  private _chunks: Uint8Array[] = [];
  private _csFormat: CSFormat;

  constructor(options?: DeflateOptions) {
    this._options = options ?? {};
    const windowBits = this._options.windowBits ?? Z_DEFAULT_WINDOWBITS;
    const { format } = resolveWindowBits(windowBits);
    this._csFormat = pakoFormatToCS(format);
  }

  push(data: Data, flushMode?: number | boolean): boolean {
    const mode = flushMode === true ? Z_FINISH : (flushMode || Z_NO_FLUSH);
    const input = toUint8Array(data);

    // CompressionStream is async — queue the work and finalize on Z_FINISH
    this._chunks.push(input);

    if (mode === Z_FINISH) {
      // Process all accumulated chunks
      const combined = concatUint8Arrays(this._chunks);
      compressWithCS(combined, this._csFormat).then((result) => {
        this.result = result;
        this.err = Z_OK;
        if (this.onData) this.onData(result);
        if (this.onEnd) this.onEnd(Z_OK);
      }).catch((e: unknown) => {
        this.err = Z_STREAM_END;
        this.msg = e instanceof Error ? e.message : 'compression error';
        if (this.onEnd) this.onEnd(this.err);
      });
    }

    return true;
  }
}
