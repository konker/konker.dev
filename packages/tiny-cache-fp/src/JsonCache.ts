import { Schema } from 'effect';

import type { Cache } from './Cache.js';
import { StrictSerializedCache } from './StrictSerializedCache.js';

export const CACHE_KIND_JSON_CACHE = 'JsonCache' as const;

export type JsonCache<R = never> = Omit<Cache<unknown, R>, '_kind'> & {
  _kind: typeof CACHE_KIND_JSON_CACHE;
};

export const JsonCache = <R>(cache: Cache<string, R>): JsonCache<R> => ({
  ...StrictSerializedCache<unknown, string, R>(cache, Schema.parseJson()),
  _kind: CACHE_KIND_JSON_CACHE,
});
