# Changelog

## 0.1.0 (2026-03-16)

Initial release.

### Features

- **Node.js backend:** Synchronous compression/decompression via built-in `zlib` module with full option support (level, windowBits, memLevel, strategy, dictionary, chunkSize)
- **Browser backend:** Async compression/decompression via `CompressionStream`/`DecompressionStream` API (deflate, deflate-raw, gzip formats)
- **Sync functions:** `deflate`, `inflate`, `gzip`, `ungzip`, `deflateRaw`, `inflateRaw` — all pako-compatible
- **Streaming classes:** `Deflate` and `Inflate` with `push`/`onData`/`onEnd` API matching pako
- **Conditional exports:** `node` condition uses sync zlib backend, `default` uses async browser backend
- **Pako compatibility layer:** `@agentine/bellows/compat/pako` entry point for zero-code-change migration
- **ESM + CJS dual package** with proper conditional exports
- **TypeScript-first:** Built-in type definitions, no `@types` package needed
- **Zero runtime dependencies**
- **94 tests** covering all formats, compression levels, strategies, dictionary support, large data, streaming, edge cases
