import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { toErrorResponseW, toHttpApiError } from '../HttpApiError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

const TAG = 'responseProcessor';

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, {}, never, R> =>
  (i: RequestW<I>) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.matchEffect({
        onFailure: (e) =>
          pipe(
            Effect.succeed(e),
            Effect.tap(Effect.logError),
            Effect.map(toHttpApiError),
            Effect.flatMap(toErrorResponseW)
          ),
        onSuccess: (o: ResponseW<O>) => Effect.succeed(o),
      })
    );
  };
