import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../index.js';
import { type RequestW } from '../RequestW.js';

export const TAG = 'requestSpan';

export const middleware =
  (name: string) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E, R> =>
  (i: RequestW<I>) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(wrapped),
      Effect.withSpan(name, {
        attributes: { 'http.method': i.method, 'http.url': i.url },
      }),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
