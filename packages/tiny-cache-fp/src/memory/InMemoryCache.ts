/* eslint-disable fp/no-nil,fp/no-mutation,fp/no-delete */
import * as P from '@konker.dev/effect-ts-prelude';

import type { Cache } from '../Cache';
import { CACHE_KIND_CACHE } from '../Cache';
import type { CacheError } from '../lib/error';

export const TAG = 'InMemoryCache';

const setVal =
  <V>(cache: Record<string, V | undefined>) =>
  (key: string, value: V, _?: number): P.Effect.Effect<void, CacheError> =>
    P.Effect.sync(() => {
      cache[key] = value;
    });

const getVal =
  <V>(cache: Record<string, V | undefined>) =>
  (key: string): P.Effect.Effect<P.Option.Option<V>, CacheError> =>
    P.Effect.sync(() => {
      return P.Option.fromNullable(cache[key]);
    });

const delVal =
  <V>(cache: Record<string, V | undefined>) =>
  (key: string): P.Effect.Effect<void, CacheError> =>
    P.Effect.sync(() => {
      delete cache[key];
    });

export type InMemoryCache<V> = Cache<V, never>;
export const InMemoryCache = <V>(): InMemoryCache<V> => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __cache = {} as Record<string, V | undefined>;

  return {
    _kind: CACHE_KIND_CACHE,

    setVal: setVal(__cache),
    getVal: getVal(__cache),
    delVal: delVal(__cache),
  };
};
