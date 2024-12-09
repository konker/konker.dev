import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'base64BodyDecoder';

export type WithBase64Body = { body?: string; isBase64Encoded?: boolean };

export const middleware =
  () =>
  <I, O, E, R>(wrapped: Handler<I, O, E, R>): Handler<I & WithBase64Body, O, E | MiddlewareError, R> =>
  (i: I & WithBase64Body) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) =>
        Effect.try({
          try: () => (i.isBase64Encoded ? { ...i, body: Buffer.from(i.body ?? '', 'base64').toString('utf-8') } : i),
          catch: toMiddlewareError,
        })
      ),
      Effect.flatMap(wrapped)
    );
