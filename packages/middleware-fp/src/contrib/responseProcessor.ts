import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler, Rec, RequestResponseHandler } from '../index.js';
import type { RequestW, ResponseW } from '../lib/http.js';
import { toHttpApiError, toResponseW } from '../lib/HttpApiError.js';

const TAG = 'responseProcessor';

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): Handler<RequestW<I>, ResponseW, never, R> =>
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
            Effect.tap(Effect.logError('Error', e)),
            Effect.map(toHttpApiError),
            Effect.flatMap(toResponseW)
          ),
        onSuccess: (o: ResponseW<O>) => Effect.succeed(o),
      })
    );
  };
