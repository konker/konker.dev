import * as P from '@konker.dev/effect-ts-prelude';

import type { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import type { CacheType } from '@konker.dev/tiny-cache-fp';
import { chainGetVal, chainSetVal } from '@konker.dev/tiny-cache-fp/dist/lib/helpers';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/error';
import { toMiddlewareError } from '../lib/error';

const TAG = 'cache-momento';

export type CacheKeyResolver<I, R> = (i: I) => P.Effect.Effect<string, MiddlewareError, R>;

export const middleware =
  <I, O, R>(
    cacheKeyResolver: CacheKeyResolver<I, MomentoClientDeps>,
    cache: CacheType<O, MomentoClientDeps>,
    ttl?: number
  ) =>
  (wrapped: Handler<I, O, MiddlewareError, R>): Handler<I, O, MiddlewareError, R | MomentoClientDeps> =>
  (i: I) =>
    P.pipe(
      // Lift the input
      P.Effect.succeed(i),
      // Log before
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      // Try to get the cached value, using a key based on the input
      (x) => x,
      P.Effect.flatMap(cacheKeyResolver),
      (x) => x,
      P.Effect.flatMap(chainGetVal(cache)),
      P.Effect.mapError(toMiddlewareError),
      (x) => x,

      // If it's a cache miss, call the next middleware in the stack, and set the output into the cache
      P.Effect.orElse(() =>
        P.pipe(
          wrapped(i),
          P.Effect.tap(P.Effect.logInfo(`[${TAG}] CACHE MISS`)),
          P.Effect.flatMap((o) =>
            P.pipe(
              cacheKeyResolver(i),
              P.Effect.flatMap((cacheKey) => chainSetVal(cache)(cacheKey, o, ttl)),
              P.Effect.mapError(toMiddlewareError)
            )
          )
        )
      ),
      (x) => x,

      // Log after
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
