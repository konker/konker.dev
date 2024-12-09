import { identity, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';

export const TAG = 'FOO';

export const middleware =
  <I, O, E, R>(_params?: never) =>
  (wrapped: Handler<I, O, E, R>): Handler<I, O, E, R> =>
  (i: I) =>
    pipe(
      // Lift the input
      Effect.succeed(i),
      // Log before
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      // Do something with the input
      Effect.map(identity),
      // Call the next middleware in the stack
      Effect.flatMap(wrapped),
      // Do something with the output
      Effect.map(identity),
      // Log after
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
