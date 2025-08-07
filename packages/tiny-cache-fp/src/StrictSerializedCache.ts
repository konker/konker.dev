import { Option, pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { CacheError } from './lib/error.js';
import { toCacheError } from './lib/error.js';
import type { TinyCache } from './TinyCache.js';

const setVal =
  <V, C, R>(cache: TinyCache<C, R>, s: Schema.Schema<V, C>) =>
  (key: string, value: V, ttlSecs?: number): Effect.Effect<void, CacheError, R> =>
    pipe(
      value,
      Schema.encode(s),
      Effect.mapError(toCacheError),
      Effect.flatMap((checked) => cache.setVal(key, checked, ttlSecs))
    );

const getVal =
  <V, C, R>(cache: TinyCache<C, R>, s: Schema.Schema<V, C>) =>
  (key: string): Effect.Effect<Option.Option<V>, CacheError, R> => {
    return pipe(cache.getVal(key), Effect.map(Option.flatMap(Schema.decodeOption(s))), Effect.mapError(toCacheError));
  };

const delVal =
  <C, R>(cache: TinyCache<C, R>) =>
  (key: string): Effect.Effect<void, CacheError, R> =>
    cache.delVal(key);

export const StrictSerializedCache = <V, C, R = never>(
  cache: TinyCache<C, R>,
  schema: Schema.Schema<V, C>
): TinyCache<V, R> => ({
  setVal: setVal(cache, schema),
  getVal: getVal(cache, schema),
  delVal: delVal(cache),
});
