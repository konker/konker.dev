/* eslint-disable fp/no-nil,fp/no-mutation,fp/no-delete */
import { Option } from 'effect';
import * as Effect from 'effect/Effect';

import type { Cache } from '../Cache.js';
import { CACHE_KIND_CACHE } from '../Cache.js';
import type { CacheError } from '../lib/error.js';

const setVal =
  <V>(cache: Record<string, V | undefined>) =>
  (key: string, value: V, _?: number): Effect.Effect<void, CacheError> =>
    Effect.sync(() => {
      cache[key] = value;
    });

const getVal =
  <V>(cache: Record<string, V | undefined>) =>
  (key: string): Effect.Effect<Option.Option<V>, CacheError> =>
    Effect.sync(() => {
      return Option.fromNullable(cache[key]);
    });

const delVal =
  <V>(cache: Record<string, V | undefined>) =>
  (key: string): Effect.Effect<void, CacheError> =>
    Effect.sync(() => {
      delete cache[key];
    });

export type InMemoryCache<V> = Cache<V, never>;
export const InMemoryCache = <V>(): InMemoryCache<V> => {
  const __cache = {} as Record<string, V | undefined>;

  return {
    _kind: CACHE_KIND_CACHE,

    setVal: setVal(__cache),
    getVal: getVal(__cache),
    delVal: delVal(__cache),
  };
};
