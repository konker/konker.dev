import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index.js';
import type { MiddlewareError } from '../lib/MiddlewareError.js';
import { toMiddlewareError } from '../lib/MiddlewareError.js';

const TAG = 'pathParametersValidator';

export type WithPathParameters = {
  pathParameters?: unknown;
};
export type WithValidatedPathParameters<V> = {
  pathParameters: V;
  validatorRawPathParameters: unknown;
};

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I, O, E, R>(
    wrapped: Handler<I & WithValidatedPathParameters<V0>, O, E, R>
  ): Handler<I & WithPathParameters, O, E | MiddlewareError, R> =>
  (i: I & WithPathParameters) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) =>
        pipe(i.pathParameters, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      Effect.mapError((e) => toMiddlewareError(e)),
      Effect.map((validatedPathParameters: V0) => ({
        ...i,
        pathParameters: validatedPathParameters,
        validatorRawPathParameters: i.pathParameters,
      })),
      Effect.flatMap(wrapped)
    );
