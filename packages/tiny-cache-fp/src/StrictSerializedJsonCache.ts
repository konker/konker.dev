import { Schema } from 'effect';

import type { Cache } from './Cache.js';
import { StrictSerializedCache } from './StrictSerializedCache.js';

export const CACHE_KIND_STRICT_SERIALIZED_JSON_CACHE = 'StrictSerializedJsonCache' as const;

export type StrictSerializedJsonCache<V, R = never> = Omit<Cache<V, R>, '_kind'> & {
  _kind: typeof CACHE_KIND_STRICT_SERIALIZED_JSON_CACHE;
};

export const StrictSerializedJsonCache = <V, C, R = never>(
  cache: Cache<string, R>,
  schema: Schema.Schema<V, C>
): StrictSerializedJsonCache<V, R> => ({
  ...StrictSerializedCache<V, string, R>(cache, Schema.parseJson(schema)),
  _kind: CACHE_KIND_STRICT_SERIALIZED_JSON_CACHE,
});
