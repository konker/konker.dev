import { Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { CacheType } from '../index';
import type { CacheError } from './error';
import { toCacheError } from './error';

/**
 * Convenience helper for getting a cache value and destructuring the Option into succeed or fail
 */
export const chainGetVal =
  <V, R>(cache: CacheType<V, R>) =>
  (key: string): Effect.Effect<V, CacheError, R> =>
    pipe(
      cache.getVal(key),
      Effect.flatMap((val: Option.Option<V>) =>
        // eslint-disable-next-line fp/no-nil
        Option.isSome(val) ? Effect.succeed(val.value) : Effect.fail(undefined)
      ),
      Effect.mapError(toCacheError)
    );

/**
 * Convenience helper for setting a cache value and getting the value back
 */
export const chainSetVal = <V, R>(
  cache: CacheType<V, R>,
  key: string,
  value: V,
  ttl?: number
): Effect.Effect<V, CacheError, R> =>
  pipe(
    cache.setVal(key, value, ttl),
    Effect.map(() => value),
    Effect.mapError(toCacheError)
  );
