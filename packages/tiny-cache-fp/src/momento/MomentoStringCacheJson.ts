import * as P from '@konker.dev/effect-ts-prelude';
import type { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';

import type { Cache } from '../Cache';
import { CACHE_KIND_CACHE } from '../Cache';
import type { CacheError } from '../lib/error';
import { toCacheError } from '../lib/error';
import { MomentoStringCache } from './MomentoStringCache';

export const TAG = 'MomentoStringCacheJson';

const setVal =
  (cache: MomentoStringCache) =>
  (key: string, value: unknown, ttlSecs?: number): P.Effect.Effect<void, CacheError, MomentoClientDeps> =>
    P.pipe(
      value,
      P.Schema.encode(P.Schema.parseJson()),
      P.Effect.flatMap((encoded) => cache.setVal(key, encoded, ttlSecs)),
      P.Effect.mapError(toCacheError)
    );

const getVal =
  (cache: MomentoStringCache) =>
  (key: string): P.Effect.Effect<P.Option.Option<unknown>, CacheError, MomentoClientDeps> =>
    P.pipe(cache.getVal(key), P.Effect.map(P.Option.flatMap(P.Schema.decodeOption(P.Schema.parseJson()))));

export const MomentoStringCacheJson = (): Cache<unknown, MomentoClientDeps> => {
  const cache = MomentoStringCache;
  return {
    _kind: CACHE_KIND_CACHE,

    getVal: getVal(cache),
    setVal: setVal(cache),
    delVal: cache.delVal,
  };
};
export type MomentoStringCacheJson = typeof MomentoStringCacheJson;
