# @agentine/bellows

Drop-in replacement for [pako](https://github.com/nodeca/pako) — zlib compression library for Node.js and browsers.

- **TypeScript-first** — built-in types, no `@types/pako` needed
- **Native delegation** — Node.js `zlib` module + browser `CompressionStream`
- **Zero dependencies**
- **ESM + CJS** dual package with conditional exports
- **pako-compatible API** — deflate, inflate, gzip, ungzip, streaming classes

## Install

```bash
npm install @agentine/bellows
```

## Usage

```typescript
import { deflate, inflate, gzip, ungzip } from '@agentine/bellows';

// Compress
const compressed = deflate('Hello, World!');

// Decompress
const decompressed = inflate(compressed, { to: 'string' });
// => 'Hello, World!'

// Gzip
const gzipped = gzip('Hello, World!');
const original = ungzip(gzipped, { to: 'string' });
```

### Streaming

```typescript
import { Deflate, Inflate } from '@agentine/bellows';
import { Z_FINISH } from '@agentine/bellows';

const deflater = new Deflate({ level: 9 });
deflater.push(data, Z_FINISH);
if (deflater.err) throw new Error(deflater.msg);
const compressed = deflater.result;
```

### Raw deflate

```typescript
import { deflateRaw, inflateRaw } from '@agentine/bellows';

const compressed = deflateRaw(input);
const decompressed = inflateRaw(compressed);
```

## Migration from pako

Replace your import:

```diff
-import pako from 'pako';
+import * as pako from '@agentine/bellows/compat/pako';
```

Or use the direct API (same function names):

```diff
-import { deflate, inflate } from 'pako';
+import { deflate, inflate } from '@agentine/bellows';
```

## API

### Sync Functions

| Function | Description |
|---|---|
| `deflate(input, options?)` | Compress (zlib format) |
| `deflateRaw(input, options?)` | Compress (raw deflate) |
| `gzip(input, options?)` | Compress (gzip format) |
| `inflate(input, options?)` | Decompress (zlib format) |
| `inflateRaw(input, options?)` | Decompress (raw deflate) |
| `ungzip(input, options?)` | Decompress (gzip format) |

### Streaming Classes

- `new Deflate(options?)` — streaming compression
- `new Inflate(options?)` — streaming decompression

Both support `push(data, flushMode)`, `onData`, `onEnd`, `result`, `err`, `msg`.

### Options

| Option | Type | Description |
|---|---|---|
| `level` | `0-9` | Compression level (0=none, 9=best) |
| `windowBits` | `number` | 8-15 zlib, -8 to -15 raw, 16+x gzip |
| `memLevel` | `1-9` | Memory usage |
| `strategy` | `number` | `Z_DEFAULT_STRATEGY`, `Z_FILTERED`, etc. |
| `dictionary` | `Uint8Array` | Preset dictionary |
| `to` | `'string'` | Return string instead of Uint8Array |
| `chunkSize` | `number` | Streaming chunk size |

### Constants

All pako/zlib constants are exported: `Z_NO_FLUSH`, `Z_FINISH`, `Z_OK`, `Z_STREAM_END`, `Z_NO_COMPRESSION`, `Z_BEST_COMPRESSION`, `Z_DEFAULT_STRATEGY`, etc.

## Browser Support

The browser build uses the `CompressionStream`/`DecompressionStream` API (Chrome 80+, Firefox 113+, Safari 16.4+).

**Limitations vs Node.js backend:**
- Functions are async (return Promises) — `CompressionStream` is inherently async
- `level`, `strategy`, `memLevel`, `dictionary` options are not supported
- Streaming class `push()` callbacks fire asynchronously

For sync compression in the browser, use the pako compat layer which imports the Node.js backend (suitable for SSR/bundlers with Node.js polyfills).

## License

MIT
