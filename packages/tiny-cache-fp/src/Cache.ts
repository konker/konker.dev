import type * as P from '@konker.dev/effect-ts-prelude';

import type { CacheError } from './lib/error.js';

export const CACHE_KIND_CACHE = 'Cache' as const;

export type Cache<C, R> = {
  readonly _kind: typeof CACHE_KIND_CACHE;

  // Write a cache entry with the given key and value
  readonly setVal: (key: string, value: C, ttlSecs?: number) => P.Effect.Effect<void, CacheError, R>;

  // Get a cache entry with the given key
  readonly getVal: (key: string) => P.Effect.Effect<P.Option.Option<C>, CacheError, R>;

  // Delete a cache entry with the given key
  readonly delVal: (key: string) => P.Effect.Effect<void, CacheError, R>;
};
