import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { RequestHeaders } from '../lib/http';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'headers-validator';

export type WithHeaders = {
  headers: RequestHeaders;
};
export type WithValidatedHeaders<V> = {
  headers: V;
  validatorRawHeaders: RequestHeaders;
};

export const middleware =
  <V>(schema: P.Schema.Schema<V>) =>
  <WI, WO, WE, WR>(
    wrapped: Handler<WI & WithValidatedHeaders<V>, WO, WE, WR>
  ): Handler<WI & WithHeaders, WO, WE | MiddlewareError, WR> =>
  (i: WI & WithHeaders) =>
    P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((i) =>
        P.pipe(i.headers, P.Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      P.Effect.mapError((e) => toMiddlewareError(e)),
      P.Effect.map((validatedHeaders: V) => ({
        ...i,
        headers: validatedHeaders,
        validatorRawHeaders: i.headers,
      })),
      P.Effect.flatMap(wrapped)
    );
