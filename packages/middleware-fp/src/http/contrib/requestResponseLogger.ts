import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../index.js';
import type { RequestW } from '../RequestW.js';

const TAG = 'requestResponseLogger';

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E, R> =>
  (i: RequestW<I>) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.tap((i) => Effect.logInfo(`[${TAG}] REQUEST`, i)),
      Effect.flatMap(wrapped),
      Effect.tap((o) => Effect.logInfo(`[${TAG}] RESPONSE`, o)),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
