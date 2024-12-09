import type { Option } from 'effect';
import type * as Effect from 'effect/Effect';

import type { CacheError } from './lib/error.js';

export const CACHE_KIND_CACHE = 'Cache' as const;

export type Cache<C, R> = {
  readonly _kind: typeof CACHE_KIND_CACHE;

  // Write a cache entry with the given key and value
  readonly setVal: (key: string, value: C, ttlSecs?: number) => Effect.Effect<void, CacheError, R>;

  // Get a cache entry with the given key
  readonly getVal: (key: string) => Effect.Effect<Option.Option<C>, CacheError, R>;

  // Delete a cache entry with the given key
  readonly delVal: (key: string) => Effect.Effect<void, CacheError, R>;
};
