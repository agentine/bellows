import { describe, it, expect } from 'vitest';
import { deflate, inflate, deflateRaw, inflateRaw, gzip, ungzip, Deflate, Inflate } from '../src/node/index.js';
import {
  Z_NO_COMPRESSION, Z_BEST_SPEED, Z_BEST_COMPRESSION, Z_DEFAULT_COMPRESSION,
  Z_FILTERED, Z_HUFFMAN_ONLY, Z_RLE, Z_FIXED, Z_DEFAULT_STRATEGY,
  Z_FINISH, Z_NO_FLUSH, Z_SYNC_FLUSH,
  Z_OK, Z_STREAM_END,
} from '../src/constants.js';

// --- Helpers ---
function randomBytes(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

function repeatString(str: string, times: number): string {
  return str.repeat(times);
}

// --- Tests ---

describe('Round-trip: all formats', () => {
  const texts = [
    'Hello, World!',
    '',
    'a',
    repeatString('abcdefghijklmnopqrstuvwxyz', 100),
    'Unicode: \u00e9\u00e0\u00fc\u00f1 \u4f60\u597d \ud83d\ude00',
  ];

  for (const text of texts) {
    const label = text.length > 40 ? `${text.slice(0, 40)}... (${text.length} chars)` : text || '(empty)';

    describe(`text: "${label}"`, () => {
      const bytes = new TextEncoder().encode(text);

      it('deflate/inflate', () => {
        const c = deflate(bytes);
        expect(inflate(c)).toEqual(bytes);
      });

      it('deflateRaw/inflateRaw', () => {
        const c = deflateRaw(bytes);
        expect(inflateRaw(c)).toEqual(bytes);
      });

      it('gzip/ungzip', () => {
        const c = gzip(bytes);
        expect(ungzip(c)).toEqual(bytes);
      });

      it('deflate with to:string', () => {
        const c = deflate(text);
        expect(inflate(c, { to: 'string' })).toBe(text);
      });

      it('gzip with to:string', () => {
        const c = gzip(text);
        expect(ungzip(c, { to: 'string' })).toBe(text);
      });
    });
  }
});

describe('Compression levels', () => {
  const input = new TextEncoder().encode(repeatString('The quick brown fox jumps over the lazy dog. ', 200));
  const levels = [Z_NO_COMPRESSION, Z_BEST_SPEED, 2, 3, 4, 5, 6, 7, 8, Z_BEST_COMPRESSION, Z_DEFAULT_COMPRESSION];

  for (const level of levels) {
    it(`level ${level} round-trips`, () => {
      const c = deflate(input, { level });
      expect(inflate(c)).toEqual(input);
    });
  }

  it('higher compression produces smaller or equal output', () => {
    const noComp = deflate(input, { level: Z_NO_COMPRESSION });
    const bestComp = deflate(input, { level: Z_BEST_COMPRESSION });
    expect(bestComp.length).toBeLessThanOrEqual(noComp.length);
  });
});

describe('Compression strategies', () => {
  const input = new TextEncoder().encode(repeatString('strategy test data ', 100));
  const strategies = [Z_DEFAULT_STRATEGY, Z_FILTERED, Z_HUFFMAN_ONLY, Z_RLE, Z_FIXED];

  for (const strategy of strategies) {
    it(`strategy ${strategy} round-trips`, () => {
      const c = deflate(input, { strategy });
      expect(inflate(c)).toEqual(input);
    });
  }
});

describe('Dictionary support', () => {
  const dict = new TextEncoder().encode('common dictionary words here');
  const input = new TextEncoder().encode('common dictionary words here and some more words');

  it('deflate/inflate with dictionary', () => {
    const compressed = deflate(input, { dictionary: dict });
    const decompressed = inflate(compressed, { dictionary: dict });
    expect(decompressed).toEqual(input);
  });

  it('deflateRaw/inflateRaw with dictionary', () => {
    const compressed = deflateRaw(input, { dictionary: dict });
    const decompressed = inflateRaw(compressed, { dictionary: dict });
    expect(decompressed).toEqual(input);
  });

  it('dictionary as ArrayBuffer', () => {
    const dictBuf = dict.buffer as ArrayBuffer;
    const compressed = deflate(input, { dictionary: dictBuf });
    const decompressed = inflate(compressed, { dictionary: dictBuf });
    expect(decompressed).toEqual(input);
  });
});

describe('Large data', () => {
  it('handles 1MB of random data', () => {
    const input = randomBytes(1024 * 1024);
    const compressed = deflate(input);
    expect(inflate(compressed)).toEqual(input);
  });

  it('handles 1MB of repetitive data (high compression ratio)', () => {
    const input = new TextEncoder().encode(repeatString('A', 1024 * 1024));
    const compressed = gzip(input);
    // Highly repetitive data should compress very well
    expect(compressed.length).toBeLessThan(input.length / 100);
    expect(ungzip(compressed)).toEqual(input);
  });
});

describe('Input types', () => {
  const text = 'input type test';
  const bytes = new TextEncoder().encode(text);

  it('accepts string', () => {
    const c = deflate(text);
    expect(inflate(c)).toEqual(bytes);
  });

  it('accepts Uint8Array', () => {
    const c = deflate(bytes);
    expect(inflate(c)).toEqual(bytes);
  });

  it('accepts ArrayBuffer', () => {
    const c = deflate(bytes.buffer as ArrayBuffer);
    expect(inflate(c)).toEqual(bytes);
  });
});

describe('Gzip format validation', () => {
  it('gzip output has correct magic bytes', () => {
    const c = gzip(new Uint8Array([1, 2, 3]));
    expect(c[0]).toBe(0x1f);
    expect(c[1]).toBe(0x8b);
  });

  it('deflate output does NOT have gzip magic bytes', () => {
    const c = deflate(new Uint8Array([1, 2, 3]));
    // zlib header starts with 0x78 (CMF byte with CM=8, CINFO varies)
    expect(c[0]).toBe(0x78);
  });
});

describe('Streaming: Deflate class', () => {
  const sample = new TextEncoder().encode(repeatString('streaming test ', 50));

  it('push with true (Z_FINISH shorthand)', () => {
    const d = new Deflate();
    d.push(sample, true);
    expect(d.err).toBe(Z_OK);
    expect(d.result).not.toBeNull();
    expect(inflate(d.result!)).toEqual(sample);
  });

  it('push with Z_FINISH constant', () => {
    const d = new Deflate();
    d.push(sample, Z_FINISH);
    expect(d.err).toBe(Z_OK);
    expect(inflate(d.result!)).toEqual(sample);
  });

  it('gzip mode via windowBits 31', () => {
    const d = new Deflate({ windowBits: 31 });
    d.push(sample, true);
    expect(d.result![0]).toBe(0x1f);
    expect(d.result![1]).toBe(0x8b);
    expect(ungzip(d.result!)).toEqual(sample);
  });

  it('raw mode via windowBits -15', () => {
    const d = new Deflate({ windowBits: -15 });
    d.push(sample, true);
    expect(inflateRaw(d.result!)).toEqual(sample);
  });

  it('with compression level option', () => {
    const d = new Deflate({ level: Z_BEST_COMPRESSION });
    d.push(sample, true);
    expect(inflate(d.result!)).toEqual(sample);
  });

  it('onData callback fires', () => {
    const chunks: Uint8Array[] = [];
    const d = new Deflate();
    d.onData = (chunk) => chunks.push(chunk);
    d.push(sample, true);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('onEnd callback fires with Z_OK', () => {
    let status = -1;
    const d = new Deflate();
    d.onEnd = (s) => { status = s; };
    d.push(sample, true);
    expect(status).toBe(Z_OK);
  });
});

describe('Streaming: Inflate class', () => {
  const sample = new TextEncoder().encode(repeatString('inflate streaming ', 50));

  it('decompresses deflate data', () => {
    const compressed = deflate(sample);
    const i = new Inflate();
    i.push(compressed, true);
    expect(i.err).toBe(Z_OK);
    expect(i.result).toEqual(sample);
  });

  it('decompresses gzip data via windowBits 31', () => {
    const compressed = gzip(sample);
    const i = new Inflate({ windowBits: 31 });
    i.push(compressed, true);
    expect(i.result).toEqual(sample);
  });

  it('decompresses raw data via windowBits -15', () => {
    const compressed = deflateRaw(sample);
    const i = new Inflate({ windowBits: -15 });
    i.push(compressed, true);
    expect(i.result).toEqual(sample);
  });

  it('onData callback fires', () => {
    const chunks: Uint8Array[] = [];
    const compressed = deflate(sample);
    const i = new Inflate();
    i.onData = (chunk) => chunks.push(chunk);
    i.push(compressed, true);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('onEnd callback fires with Z_OK', () => {
    let status = -1;
    const compressed = deflate(sample);
    const i = new Inflate();
    i.onEnd = (s) => { status = s; };
    i.push(compressed, true);
    expect(status).toBe(Z_OK);
  });
});

describe('Edge cases', () => {
  it('empty Uint8Array', () => {
    const c = deflate(new Uint8Array(0));
    expect(inflate(c)).toEqual(new Uint8Array(0));
  });

  it('empty string', () => {
    const c = deflate('');
    expect(inflate(c, { to: 'string' })).toBe('');
  });

  it('single byte', () => {
    const input = new Uint8Array([42]);
    const c = deflate(input);
    expect(inflate(c)).toEqual(input);
  });

  it('binary data with null bytes', () => {
    const input = new Uint8Array([0, 0, 0, 1, 0, 0, 0]);
    const c = deflate(input);
    expect(inflate(c)).toEqual(input);
  });

  it('all possible byte values', () => {
    const input = new Uint8Array(256);
    for (let i = 0; i < 256; i++) input[i] = i;
    const c = deflate(input);
    expect(inflate(c)).toEqual(input);
  });
});

describe('windowBits format detection', () => {
  const input = new TextEncoder().encode('windowBits test');

  it('windowBits 15 = zlib format', () => {
    const c = deflate(input, { windowBits: 15 });
    expect(c[0]).toBe(0x78); // zlib header
    expect(inflate(c, { windowBits: 15 })).toEqual(input);
  });

  it('windowBits 9 = zlib format (smaller window)', () => {
    const c = deflate(input, { windowBits: 9 });
    expect(inflate(c, { windowBits: 9 })).toEqual(input);
  });
});
