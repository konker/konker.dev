import * as M from '@konker.dev/momento-cache-client-effect';
import type { Option } from 'effect';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Cache } from '../Cache.js';
import { CACHE_KIND_CACHE } from '../Cache.js';
import type { CacheError } from '../lib/error.js';
import { toCacheError } from '../lib/error.js';

const setVal = (key: string, value: string, ttlSecs?: number): Effect.Effect<void, CacheError, M.MomentoClientDeps> =>
  pipe(M.MomentoSetDefaultCache(key, value, ttlSecs), (x) => x, Effect.mapError(toCacheError));

const getVal = (key: string): Effect.Effect<Option.Option<string>, CacheError, M.MomentoClientDeps> =>
  pipe(M.MomentoGetDefaultCache(key), Effect.mapError(toCacheError));

const delVal = (key: string): Effect.Effect<void, CacheError, M.MomentoClientDeps> =>
  pipe(M.MomentoDelDefaultCache(key), Effect.mapError(toCacheError));

export const MomentoStringCache: Cache<string, M.MomentoClientDeps> = {
  _kind: CACHE_KIND_CACHE,

  getVal,
  setVal,
  delVal,
};
export type MomentoStringCache = typeof MomentoStringCache;
