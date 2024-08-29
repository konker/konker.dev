import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'base64BodyDecoder';

export type WithBase64Body = { body?: string; isBase64Encoded?: boolean };

export const middleware =
  () =>
  <I extends WithBase64Body, O, E, R>(wrapped: Handler<I, O, E, R>): Handler<I, O, E | MiddlewareError, R> =>
  (i: I) =>
    P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((i) =>
        P.Effect.try({
          try: () => (i.isBase64Encoded ? { ...i, body: Buffer.from(i.body ?? '', 'base64').toString('utf-8') } : i),
          catch: toMiddlewareError,
        })
      ),
      P.Effect.flatMap(wrapped)
    );
