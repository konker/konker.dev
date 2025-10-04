import type { CacheKeyResolver } from '@konker.dev/tiny-cache-fp/lib/CacheKeyResolver';
import { chainGetVal, chainSetVal } from '@konker.dev/tiny-cache-fp/lib/helpers';
import { InMemoryCache } from '@konker.dev/tiny-cache-fp/memory/InMemoryCache';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

const TAG = 'cacheInMemory';

export const middleware =
  <I extends Rec, CR>(cacheKeyResolver: CacheKeyResolver<I, CR>) =>
  <O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R | CR> => {
    const cache = InMemoryCache<ResponseW<O>>();

    return (i: RequestW<I>) =>
      pipe(
        // Lift the input
        Effect.succeed(i),
        // Log before
        Effect.tap(Effect.logDebug(`[${TAG}] IN`)),

        // Try to get the cached value, using a key based on the input
        Effect.flatMap(cacheKeyResolver),
        Effect.flatMap(chainGetVal(cache)),
        Effect.mapError(toMiddlewareError),

        // If it's a cache miss, call the next middleware in the stack, and set the output into the cache
        Effect.orElse(() =>
          pipe(
            wrapped(i),
            Effect.tap(Effect.logInfo(`[${TAG}] CACHE MISS`)),
            Effect.flatMap((o) =>
              pipe(
                cacheKeyResolver(i),
                Effect.flatMap((cacheKey) => chainSetVal(cache, cacheKey, o)),
                Effect.mapError(toMiddlewareError)
              )
            )
          )
        ),

        // Log after
        Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
      );
  };
