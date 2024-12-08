import * as P from '@konker.dev/effect-ts-prelude';
import * as M from '@konker.dev/momento-cache-client-effect';

import type { Cache } from '../Cache';
import { CACHE_KIND_CACHE } from '../Cache';
import type { CacheError } from '../lib/error';
import { toCacheError } from '../lib/error';

export const TAG = 'MomentoStringCache';

const setVal = (key: string, value: string, ttlSecs?: number): P.Effect.Effect<void, CacheError, M.MomentoClientDeps> =>
  P.pipe(M.MomentoSetDefaultCache(key, value, ttlSecs), P.Effect.mapError(toCacheError));

const getVal = (key: string): P.Effect.Effect<P.Option.Option<string>, CacheError, M.MomentoClientDeps> =>
  P.pipe(M.MomentoGetDefaultCache(key), P.Effect.mapError(toCacheError));

const delVal = (key: string): P.Effect.Effect<void, CacheError, M.MomentoClientDeps> =>
  P.pipe(M.MomentoDelDefaultCache(key), P.Effect.mapError(toCacheError));

export const MomentoStringCache: Cache<string, M.MomentoClientDeps> = {
  _kind: CACHE_KIND_CACHE,

  getVal,
  setVal,
  delVal,
};
export type MomentoStringCache = typeof MomentoStringCache;
