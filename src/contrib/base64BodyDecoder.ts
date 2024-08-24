import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'base64-body-decoder';

export type WithBase64Body = { body?: string; isBase64Encoded?: boolean };
export type WithDecodedBase64Body = { body?: string; isBase64Encoded?: boolean };

export const middleware =
  () =>
  <I extends WithBase64Body, WO, WE, WR>(
    wrapped: Handler<I & WithDecodedBase64Body, WO, WE, WR>
  ): Handler<I, WO, WE | MiddlewareError, WR> =>
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
