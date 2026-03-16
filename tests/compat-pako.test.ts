import { describe, it, expect } from 'vitest';
import * as pako from '../src/compat/pako.js';

describe('pako compat layer', () => {
  const sample = 'Hello from the pako compat layer!';
  const sampleBytes = new TextEncoder().encode(sample);

  it('exports all sync functions', () => {
    expect(typeof pako.deflate).toBe('function');
    expect(typeof pako.inflate).toBe('function');
    expect(typeof pako.deflateRaw).toBe('function');
    expect(typeof pako.inflateRaw).toBe('function');
    expect(typeof pako.gzip).toBe('function');
    expect(typeof pako.ungzip).toBe('function');
  });

  it('exports streaming classes', () => {
    expect(typeof pako.Deflate).toBe('function');
    expect(typeof pako.Inflate).toBe('function');
  });

  it('exports all constants', () => {
    expect(pako.Z_NO_FLUSH).toBe(0);
    expect(pako.Z_FINISH).toBe(4);
    expect(pako.Z_OK).toBe(0);
    expect(pako.Z_STREAM_END).toBe(1);
    expect(pako.Z_DATA_ERROR).toBe(-3);
    expect(pako.Z_NO_COMPRESSION).toBe(0);
    expect(pako.Z_BEST_COMPRESSION).toBe(9);
    expect(pako.Z_DEFAULT_STRATEGY).toBe(0);
  });

  it('deflate/inflate round-trips', () => {
    const compressed = pako.deflate(sampleBytes);
    const decompressed = pako.inflate(compressed, { to: 'string' });
    expect(decompressed).toBe(sample);
  });

  it('gzip/ungzip round-trips', () => {
    const compressed = pako.gzip(sample);
    const decompressed = pako.ungzip(compressed, { to: 'string' });
    expect(decompressed).toBe(sample);
  });
});
