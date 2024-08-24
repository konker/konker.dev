import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'query-string-validator';

export type WithQueryStringParameters = {
  queryStringParameters?: unknown;
};
export type WithValidatedQueryStringParameters<V> = {
  validatedQueryStringParameters?: V;
};

export const middleware =
  <V>(schema: P.Schema.Schema<V>) =>
  <I extends WithQueryStringParameters, WO, WE, WR>(
    wrapped: Handler<I & WithValidatedQueryStringParameters<V>, WO, WE, WR>
  ): Handler<I, WO, WE | MiddlewareError, WR> =>
  (i: I) =>
    P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((i) =>
        P.pipe(i.queryStringParameters, P.Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      P.Effect.mapError((e) => toMiddlewareError(e)),
      P.Effect.map((validatedQueryStringParameters: V) => ({
        ...i,
        validatedQueryStringParameters,
      })),
      P.Effect.flatMap(wrapped)
    );
