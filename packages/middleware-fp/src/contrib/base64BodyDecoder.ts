import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../lib/http.js';
import type { MiddlewareError } from '../lib/MiddlewareError.js';
import { toMiddlewareError } from '../lib/MiddlewareError.js';

const TAG = 'base64BodyDecoder';

export const middleware =
  <I extends Rec>(isBase64Encoded: (i: RequestW<I>) => boolean) =>
  <O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R> =>
  (i: RequestW<I>) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) =>
        Effect.try({
          try: () =>
            isBase64Encoded(i) ? makeRequestW(i, { body: Buffer.from(i.body ?? '', 'base64').toString('utf-8') }) : i,
          catch: toMiddlewareError,
        })
      ),
      Effect.flatMap(wrapped)
    );
