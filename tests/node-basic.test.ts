import { describe, it, expect } from 'vitest';
import { deflate, inflate, deflateRaw, inflateRaw, gzip, ungzip, Deflate, Inflate } from '../src/node/index.js';
import { Z_BEST_COMPRESSION, Z_NO_COMPRESSION, Z_FINISH } from '../src/constants.js';

describe('Node.js sync functions', () => {
  const sample = 'Hello, bellows! This is a test string for compression.';
  const sampleBytes = new TextEncoder().encode(sample);

  describe('deflate/inflate (zlib format)', () => {
    it('round-trips Uint8Array', () => {
      const compressed = deflate(sampleBytes);
      expect(compressed).toBeInstanceOf(Uint8Array);
      expect(compressed.length).toBeLessThan(sampleBytes.length * 2);
      const decompressed = inflate(compressed);
      expect(decompressed).toEqual(sampleBytes);
    });

    it('round-trips string input', () => {
      const compressed = deflate(sample);
      const decompressed = inflate(compressed, { to: 'string' });
      expect(decompressed).toBe(sample);
    });

    it('round-trips ArrayBuffer input', () => {
      const compressed = deflate(sampleBytes.buffer as ArrayBuffer);
      const decompressed = inflate(compressed);
      expect(decompressed).toEqual(sampleBytes);
    });

    it('handles empty input', () => {
      const compressed = deflate(new Uint8Array(0));
      const decompressed = inflate(compressed);
      expect(decompressed).toEqual(new Uint8Array(0));
    });

    it('respects compression level', () => {
      const noComp = deflate(sampleBytes, { level: Z_NO_COMPRESSION });
      const maxComp = deflate(sampleBytes, { level: Z_BEST_COMPRESSION });
      // No compression should produce larger output
      expect(noComp.length).toBeGreaterThanOrEqual(maxComp.length);
    });
  });

  describe('deflateRaw/inflateRaw (raw format)', () => {
    it('round-trips', () => {
      const compressed = deflateRaw(sampleBytes);
      const decompressed = inflateRaw(compressed);
      expect(decompressed).toEqual(sampleBytes);
    });

    it('round-trips string output', () => {
      const compressed = deflateRaw(sample);
      const decompressed = inflateRaw(compressed, { to: 'string' });
      expect(decompressed).toBe(sample);
    });
  });

  describe('gzip/ungzip', () => {
    it('round-trips', () => {
      const compressed = gzip(sampleBytes);
      const decompressed = ungzip(compressed);
      expect(decompressed).toEqual(sampleBytes);
    });

    it('round-trips string output', () => {
      const compressed = gzip(sample);
      const decompressed = ungzip(compressed, { to: 'string' });
      expect(decompressed).toBe(sample);
    });

    it('produces valid gzip (has gzip magic bytes)', () => {
      const compressed = gzip(sampleBytes);
      // Gzip magic number: 0x1f 0x8b
      expect(compressed[0]).toBe(0x1f);
      expect(compressed[1]).toBe(0x8b);
    });
  });

  describe('Deflate streaming class', () => {
    it('compresses with push + finish', () => {
      const d = new Deflate();
      d.push(sampleBytes, Z_FINISH);
      expect(d.err).toBe(0);
      expect(d.result).toBeInstanceOf(Uint8Array);
      const decompressed = inflate(d.result!);
      expect(decompressed).toEqual(sampleBytes);
    });

    it('calls onData callback', () => {
      const chunks: Uint8Array[] = [];
      const d = new Deflate();
      d.onData = (chunk) => chunks.push(chunk);
      d.push(sampleBytes, Z_FINISH);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('calls onEnd callback', () => {
      let endStatus: number | null = null;
      const d = new Deflate();
      d.onEnd = (status) => { endStatus = status; };
      d.push(sampleBytes, Z_FINISH);
      expect(endStatus).toBe(0);
    });

    it('supports gzip via windowBits', () => {
      const d = new Deflate({ windowBits: 16 + 15 });
      d.push(sampleBytes, Z_FINISH);
      expect(d.result![0]).toBe(0x1f);
      expect(d.result![1]).toBe(0x8b);
      const decompressed = ungzip(d.result!);
      expect(decompressed).toEqual(sampleBytes);
    });

    it('supports raw via negative windowBits', () => {
      const d = new Deflate({ windowBits: -15 });
      d.push(sampleBytes, Z_FINISH);
      const decompressed = inflateRaw(d.result!);
      expect(decompressed).toEqual(sampleBytes);
    });
  });

  describe('Inflate streaming class', () => {
    it('decompresses with push + finish', () => {
      const compressed = deflate(sampleBytes);
      const i = new Inflate();
      i.push(compressed, Z_FINISH);
      expect(i.err).toBe(0);
      expect(i.result).toEqual(sampleBytes);
    });

    it('decompresses gzip via windowBits', () => {
      const compressed = gzip(sampleBytes);
      const i = new Inflate({ windowBits: 16 + 15 });
      i.push(compressed, Z_FINISH);
      expect(i.result).toEqual(sampleBytes);
    });

    it('decompresses raw via negative windowBits', () => {
      const compressed = deflateRaw(sampleBytes);
      const i = new Inflate({ windowBits: -15 });
      i.push(compressed, Z_FINISH);
      expect(i.result).toEqual(sampleBytes);
    });
  });
});
