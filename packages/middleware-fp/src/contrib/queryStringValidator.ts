import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index.js';
import type { MiddlewareError } from '../lib/MiddlewareError.js';
import { toMiddlewareError } from '../lib/MiddlewareError.js';

const TAG = 'queryStringValidator';

export type WithQueryStringParameters = {
  queryStringParameters?: unknown;
};
export type WithValidatedQueryStringParameters<V> = {
  queryStringParameters: V;
  validatorRawQueryStringParameters: unknown;
};

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I, O, E, R>(
    wrapped: Handler<I & WithValidatedQueryStringParameters<V0>, O, E, R>
  ): Handler<I & WithQueryStringParameters, O, E | MiddlewareError, R> =>
  (i: I & WithQueryStringParameters) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) =>
        pipe(i.queryStringParameters, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      Effect.mapError((e) => toMiddlewareError(e)),
      Effect.map((validatedQueryStringParameters: V0) => ({
        ...i,
        queryStringParameters: validatedQueryStringParameters,
        validatorRawQueryStringParameters: i.queryStringParameters,
      })),
      Effect.flatMap(wrapped)
    );
