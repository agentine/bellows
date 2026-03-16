// pako compatibility layer — matches pako's exact export shape
// Import from the node backend directly for zero-code-change migration
export { deflate, deflateRaw, gzip, Deflate } from '../node/deflate.js';
export { inflate, inflateRaw, ungzip, Inflate } from '../node/inflate.js';
export {
  Z_NO_FLUSH,
  Z_PARTIAL_FLUSH,
  Z_SYNC_FLUSH,
  Z_FULL_FLUSH,
  Z_FINISH,
  Z_BLOCK,
  Z_TREES,
  Z_OK,
  Z_STREAM_END,
  Z_NEED_DICT,
  Z_ERRNO,
  Z_STREAM_ERROR,
  Z_DATA_ERROR,
  Z_MEM_ERROR,
  Z_BUF_ERROR,
  Z_VERSION_ERROR,
  Z_NO_COMPRESSION,
  Z_BEST_SPEED,
  Z_BEST_COMPRESSION,
  Z_DEFAULT_COMPRESSION,
  Z_FILTERED,
  Z_HUFFMAN_ONLY,
  Z_RLE,
  Z_FIXED,
  Z_DEFAULT_STRATEGY,
} from '../constants.js';
export type { Data, DeflateOptions, InflateOptions, GzipHeader } from '../types.js';
