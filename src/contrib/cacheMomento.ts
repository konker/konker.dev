import * as P from '@konker.dev/effect-ts-prelude';

import type { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import type { CacheType } from '@konker.dev/tiny-cache-fp';
import type { CacheKeyResolver } from '@konker.dev/tiny-cache-fp/dist/lib/CacheKeyResolver';
import { chainGetVal, chainSetVal } from '@konker.dev/tiny-cache-fp/dist/lib/helpers';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'cacheMomento';

export const middleware =
  <WI, WO, CR>(cacheKeyResolver: CacheKeyResolver<WI, CR>, cache: CacheType<WO, MomentoClientDeps>, ttl?: number) =>
  <WE, WR>(wrapped: Handler<WI, WO, WE, WR>): Handler<WI, WO, WE | MiddlewareError, WR | CR | MomentoClientDeps> =>
  (i: WI) =>
    P.pipe(
      // Lift the input
      P.Effect.succeed(i),
      // Log before
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      // Try to get the cached value, using a key based on the input
      P.Effect.flatMap(cacheKeyResolver),
      P.Effect.flatMap(chainGetVal(cache)),
      P.Effect.mapError(toMiddlewareError),

      // If it's a cache miss, call the next middleware in the stack, and set the output into the cache
      P.Effect.orElse(() =>
        P.pipe(
          wrapped(i),
          P.Effect.tap(P.Effect.logInfo(`[${TAG}] CACHE MISS`)),
          P.Effect.flatMap((o) =>
            P.pipe(
              cacheKeyResolver(i),
              P.Effect.flatMap((cacheKey) => chainSetVal(cache, cacheKey, o, ttl)),
              P.Effect.mapError(toMiddlewareError)
            )
          )
        )
      ),

      // Log after
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
