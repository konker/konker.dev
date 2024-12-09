import { Option, pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Cache } from './Cache.js';
import type { CacheError } from './lib/error.js';
import { toCacheError } from './lib/error.js';

export const CACHE_KIND_STRICT_SERIALIZED_CACHE = 'StrictSerializedCache' as const;

const setVal =
  <V, C, R>(cache: Cache<C, R>, s: Schema.Schema<V, C>) =>
  (key: string, value: V, ttlSecs?: number): Effect.Effect<void, CacheError, R> =>
    pipe(
      value,
      Schema.encode(s),
      Effect.mapError(toCacheError),
      Effect.flatMap((checked) => cache.setVal(key, checked, ttlSecs))
    );

const getVal =
  <V, C, R>(cache: Cache<C, R>, s: Schema.Schema<V, C>) =>
  (key: string): Effect.Effect<Option.Option<V>, CacheError, R> => {
    return pipe(cache.getVal(key), Effect.map(Option.flatMap(Schema.decodeOption(s))), Effect.mapError(toCacheError));
  };

const delVal =
  <C, R>(cache: Cache<C, R>) =>
  (key: string): Effect.Effect<void, CacheError, R> =>
    cache.delVal(key);

export type StrictSerializedCache<V, R> = Omit<Cache<V, R>, '_kind'> & {
  _kind: typeof CACHE_KIND_STRICT_SERIALIZED_CACHE;
};

export const StrictSerializedCache = <V, C, R>(
  cache: Cache<C, R>,
  schema: Schema.Schema<V, C>
): StrictSerializedCache<V, R> => ({
  _kind: CACHE_KIND_STRICT_SERIALIZED_CACHE,

  setVal: setVal(cache, schema),
  getVal: getVal(cache, schema),
  delVal: delVal(cache),
});
