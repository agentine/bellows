# Bellows — Drop-in Replacement for pako

## Overview

**Replaces:** [pako](https://github.com/nodeca/pako) — zlib port to JavaScript (~50M weekly npm downloads, 6.1k GitHub stars, 3,746 dependents, single npm maintainer, last release v2.1.0 November 2022, 23 open issues, 4 unmerged PRs, seeking new maintainers via issue #293).

**Package name:** `@agentine/bellows` (verified available on npm)

**Language:** TypeScript (Node.js)

**Why:** pako has been unmaintained for 3.5+ years. No TypeScript types built-in (users rely on community @types/pako with 4.1M weekly downloads). Single npm maintainer actively seeking help. No existing drop-in replacement — fflate exists but has a completely different functional API. The 50M weekly download user base needs a maintained alternative with API compatibility.

## Architecture

### Core Approach

Delegate to native compression APIs rather than reimplementing zlib in JavaScript:

- **Node.js:** Use built-in `zlib` module (full option support: levels, strategies, windowBits, dictionary, memLevel)
- **Browsers:** Use `CompressionStream`/`DecompressionStream` API (Chrome 80+, Firefox 113+, Safari 16.4+) for basic operations

### Module Structure

```
src/
├── index.ts              # Main exports (deflate, inflate, gzip, ungzip, etc.)
├── constants.ts          # Z_NO_FLUSH, Z_SYNC_FLUSH, Z_OK, etc.
├── deflate.ts            # Deflate class + deflate/deflateRaw/gzip functions
├── inflate.ts            # Inflate class + inflate/inflateRaw/ungzip functions
├── node/                 # Node.js implementation (wraps zlib module)
│   ├── deflate.ts
│   └── inflate.ts
├── browser/              # Browser implementation (wraps CompressionStream)
│   ├── deflate.ts
│   └── inflate.ts
└── utils.ts              # Shared utilities (Uint8Array helpers, string conversion)
```

### Conditional Exports

```json
{
  "exports": {
    ".": {
      "node": { "import": "./dist/node/index.mjs", "require": "./dist/node/index.cjs" },
      "default": { "import": "./dist/browser/index.mjs", "require": "./dist/browser/index.cjs" }
    }
  }
}
```

## API Surface (pako-compatible)

### Sync Functions
- `deflate(input, options?)` — compress (zlib format)
- `deflateRaw(input, options?)` — compress (raw deflate)
- `gzip(input, options?)` — compress (gzip format)
- `inflate(input, options?)` — decompress (zlib format)
- `inflateRaw(input, options?)` — decompress (raw deflate)
- `ungzip(input, options?)` — decompress (gzip format)

### Streaming Classes
- `Deflate(options?)` — streaming compression
- `Inflate(options?)` — streaming decompression

### Constants
- `Z_NO_FLUSH`, `Z_SYNC_FLUSH`, `Z_FULL_FLUSH`, `Z_FINISH`
- `Z_OK`, `Z_STREAM_END`, `Z_NEED_DICT`, `Z_DATA_ERROR`
- `Z_NO_COMPRESSION` through `Z_BEST_COMPRESSION`
- `Z_DEFAULT_STRATEGY`, `Z_FILTERED`, `Z_HUFFMAN_ONLY`, `Z_RLE`, `Z_FIXED`

### Options (pako-compatible)
- `level` (0-9): compression level
- `windowBits` (8-15, -8 to -15, 16+8 to 16+15): format control
- `memLevel` (1-9): memory usage
- `strategy`: compression strategy
- `dictionary`: preset dictionary
- `raw`: raw deflate mode
- `to` ('string'): output as string
- `chunkSize`: streaming chunk size

## Compatibility Layer

Provide `bellows/compat/pako` entry point that matches pako's exact export shape for zero-code-change migration.

## Key Differentiators

1. **TypeScript-first:** Built-in types, no @types needed
2. **Native delegation:** Faster than pure JS zlib by using Node.js zlib + browser CompressionStream
3. **ESM + CJS:** Dual package with proper conditional exports
4. **Zero dependencies**
5. **Drop-in compatible:** Matches pako's API exactly
6. **Active maintenance:** Bug fixes, security patches, new runtime support
7. **Node.js 18+** minimum (aligns with current LTS)

## Deliverables

1. Project scaffolding (package.json, tsconfig, build tooling, CI)
2. Core types and constants
3. Node.js implementation (zlib wrapper)
4. Browser implementation (CompressionStream wrapper)
5. Streaming classes (Deflate/Inflate)
6. Compatibility layer (bellows/compat/pako)
7. Test suite (pako test compatibility + edge cases)
8. Documentation and README
