import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';

const TAG = 'request-response-logger';

export const middleware =
  () =>
  <I, O, E, R>(wrapped: Handler<I, O, E, R>): Handler<I, O, E, R> =>
  (i: I) => {
    return P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.tap((i) => P.Effect.logInfo(`[${TAG}] REQUEST`, i)),
      P.Effect.flatMap(wrapped),
      P.Effect.tap((o) => P.Effect.logInfo(`[${TAG}] RESPONSE`, o)),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
