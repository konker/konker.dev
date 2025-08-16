import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../request.js';
import { makeResponseW } from '../response.js';

export const TAG = 'trivial';

export const middleware =
  (_params?: never) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E, R> =>
  (i: RequestW<I>) =>
    pipe(
      // Lift the input
      Effect.succeed(i),
      // Log before
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      // Do something with the input
      Effect.map((i) => makeRequestW(i)),
      // Call the next middleware in the stack
      Effect.flatMap(wrapped),
      // Do something with the output
      Effect.map((o) => makeResponseW(o)),
      // Log after
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
