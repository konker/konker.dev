import type { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { Option, pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Cache } from '../Cache';
import { CACHE_KIND_CACHE } from '../Cache';
import type { CacheError } from '../lib/error';
import { toCacheError } from '../lib/error';
import { MomentoStringCache } from './MomentoStringCache';

export const TAG = 'MomentoStringCacheJson';

const setVal =
  (cache: MomentoStringCache) =>
  (key: string, value: unknown, ttlSecs?: number): Effect.Effect<void, CacheError, MomentoClientDeps> =>
    pipe(
      value,
      Schema.encode(Schema.parseJson()),
      Effect.flatMap((encoded) => cache.setVal(key, encoded, ttlSecs)),
      Effect.mapError(toCacheError)
    );

const getVal =
  (cache: MomentoStringCache) =>
  (key: string): Effect.Effect<Option.Option<unknown>, CacheError, MomentoClientDeps> =>
    pipe(cache.getVal(key), Effect.map(Option.flatMap(Schema.decodeOption(Schema.parseJson()))));

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
