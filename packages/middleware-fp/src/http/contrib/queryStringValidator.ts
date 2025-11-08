import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../RequestW.js';

const TAG = 'queryStringValidator';

export type WithValidatedQueryStringParameters<V> = {
  queryStringParameters: V;
  queryStringValidatorRaw: unknown;
};

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithValidatedQueryStringParameters<V0>, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R> =>
  (i: RequestW<I>) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) =>
        pipe(i.queryStringParameters, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      Effect.mapError((e) => toMiddlewareError(e)),
      Effect.map((validatedQueryStringParameters: V0) =>
        makeRequestW(i, {
          queryStringParameters: validatedQueryStringParameters,
          queryStringValidatorRaw: i.queryStringParameters,
        })
      ),
      Effect.flatMap(wrapped)
    );
