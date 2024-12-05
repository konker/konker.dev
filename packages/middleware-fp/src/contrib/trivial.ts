import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';

export const TAG = 'FOO';

export const middleware =
  <I, O, E, R>(_params?: never) =>
  (wrapped: Handler<I, O, E, R>): Handler<I, O, E, R> =>
  (i: I) =>
    P.pipe(
      // Lift the input
      P.Effect.succeed(i),
      // Log before
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      // Do something with the input
      P.Effect.map(P.identity),
      // Call the next middleware in the stack
      P.Effect.flatMap(wrapped),
      // Do something with the output
      P.Effect.map(P.identity),
      // Log after
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
