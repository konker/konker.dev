import * as P from '@konker.dev/effect-ts-prelude';

import type { CacheType } from '../index';
import type { CacheError } from './error';
import { toCacheError } from './error';

/**
 * Convenience helper for getting a cache value and destructuring the Option into succeed or fail
 */
export const chainGetVal =
  <V, R>(cache: CacheType<V, R>) =>
  (key: string): P.Effect.Effect<V, CacheError, R> =>
    P.pipe(
      cache.getVal(key),
      P.Effect.flatMap((val: P.Option.Option<V>) =>
        // eslint-disable-next-line fp/no-nil
        P.Option.isSome(val) ? P.Effect.succeed(val.value) : P.Effect.fail(undefined)
      ),
      P.Effect.mapError(toCacheError)
    );

/**
 * Convenience helper for setting a cache value and getting the value back
 */
export const chainSetVal = <V, R>(
  cache: CacheType<V, R>,
  key: string,
  value: V,
  ttl?: number
): P.Effect.Effect<V, CacheError, R> =>
  P.pipe(
    cache.setVal(key, value, ttl),
    P.Effect.map(() => value),
    P.Effect.mapError(toCacheError)
  );
