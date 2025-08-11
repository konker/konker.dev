import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../request.js';

const TAG = 'pathParametersValidator';

export type WithValidatedPathParameters<V> = {
  pathParameters: V;
  pathParametersValidatorRaw: RequestW['pathParameters'];
};

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithValidatedPathParameters<V0>, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R> =>
  (i: RequestW<I>) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) =>
        pipe(i.pathParameters, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      Effect.mapError((e) => toMiddlewareError(e)),
      Effect.map((validatedPathParameters: V0) =>
        makeRequestW(i, {
          pathParameters: validatedPathParameters,
          pathParametersValidatorRaw: i.pathParameters,
        })
      ),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
