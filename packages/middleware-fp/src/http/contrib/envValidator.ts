import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../RequestW.js';

const TAG = 'envValidator';

export type WithValidatedEnv<V> = {
  validatedEnv: V;
};

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithValidatedEnv<V0>, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R> =>
  (i: RequestW<I>) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      // Parse the environment according to the given schema and inject into input
      Effect.flatMap((_) =>
        pipe(process.env, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      Effect.mapError(toMiddlewareError),
      Effect.map((validatedEnv: V0) => makeRequestW(i, { validatedEnv })),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
