import type { Layer } from 'effect';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../index.js';
import { type RequestW } from '../RequestW.js';

export const TAG = 'provideLayer';

export const middleware =
  <L>(layer: Layer.Layer<L>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R | L>
  ): RequestResponseHandler<I, O, E, Exclude<R, L>> =>
  (i: RequestW<I>) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(wrapped),
      Effect.provide(layer),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
