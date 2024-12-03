import * as P from '@konker.dev/effect-ts-prelude';

import type { Cache } from './Cache';
import type { CacheError } from './lib/error';
import { toCacheError } from './lib/error';

export const CACHE_KIND_STRICT_SERIALIZED_CACHE = 'StrictSerializedCache' as const;

const setVal =
  <V, C, R>(cache: Cache<C, R>, s: P.Schema.Schema<V, C>) =>
  (key: string, value: V, ttlSecs?: number): P.Effect.Effect<void, CacheError, R> =>
    P.pipe(
      value,
      P.Schema.encode(s),
      P.Effect.mapError(toCacheError),
      P.Effect.flatMap((checked) => cache.setVal(key, checked, ttlSecs))
    );

const getVal =
  <V, C, R>(cache: Cache<C, R>, s: P.Schema.Schema<V, C>) =>
  (key: string): P.Effect.Effect<P.Option.Option<V>, CacheError, R> => {
    return P.pipe(
      cache.getVal(key),
      P.Effect.map(P.Option.flatMap(P.Schema.decodeOption(s))),
      P.Effect.mapError(toCacheError)
    );
  };

const delVal =
  <C, R>(cache: Cache<C, R>) =>
  (key: string): P.Effect.Effect<void, CacheError, R> =>
    cache.delVal(key);

export type StrictSerializedCache<V, R> = Omit<Cache<V, R>, '_kind'> & {
  _kind: typeof CACHE_KIND_STRICT_SERIALIZED_CACHE;
};

export const StrictSerializedCache = <V, C, R>(
  cache: Cache<C, R>,
  schema: P.Schema.Schema<V, C>
): StrictSerializedCache<V, R> => ({
  _kind: CACHE_KIND_STRICT_SERIALIZED_CACHE,

  setVal: setVal(cache, schema),
  getVal: getVal(cache, schema),
  delVal: delVal(cache),
});
