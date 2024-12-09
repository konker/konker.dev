import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';

const TAG = 'requestResponseLogger';

export const middleware =
  () =>
  <I, O, E, R>(wrapped: Handler<I, O, E, R>): Handler<I, O, E, R> =>
  (i: I) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.tap((i) => Effect.logInfo(`[${TAG}] REQUEST`, i)),
      Effect.flatMap(wrapped),
      Effect.tap((o) => Effect.logInfo(`[${TAG}] RESPONSE`, o)),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
