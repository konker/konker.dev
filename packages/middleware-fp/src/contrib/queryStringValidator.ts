import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'queryStringValidator';

export type WithQueryStringParameters = {
  queryStringParameters?: unknown;
};
export type WithValidatedQueryStringParameters<V> = {
  queryStringParameters: V;
  validatorRawQueryStringParameters: unknown;
};

export const middleware =
  <V0, V1>(schema: P.Schema.Schema<V0, V1>) =>
  <I, O, E, R>(
    wrapped: Handler<I & WithValidatedQueryStringParameters<V0>, O, E, R>
  ): Handler<I & WithQueryStringParameters, O, E | MiddlewareError, R> =>
  (i: I & WithQueryStringParameters) =>
    P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((i) =>
        P.pipe(i.queryStringParameters, P.Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      P.Effect.mapError((e) => toMiddlewareError(e)),
      P.Effect.map((validatedQueryStringParameters: V0) => ({
        ...i,
        queryStringParameters: validatedQueryStringParameters,
        validatorRawQueryStringParameters: i.queryStringParameters,
      })),
      P.Effect.flatMap(wrapped)
    );
