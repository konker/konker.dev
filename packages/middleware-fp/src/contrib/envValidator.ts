import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'envValidator';

export type WithValidatedEnv<V> = {
  validatedEnv: V;
};

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I, O, E, R>(wrapped: Handler<I & WithValidatedEnv<V0>, O, E, R>): Handler<I, O, E | MiddlewareError, R> =>
  (i: I) =>
    pipe(
      // Lift the input
      Effect.succeed(i),
      // Log before
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      // Parse the environment according to the given schema and inject into input
      Effect.flatMap((_) =>
        pipe(process.env, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      Effect.mapError(toMiddlewareError),
      Effect.map((validatedEnv: V0) => ({
        ...i,
        validatedEnv,
      })),
      // Call the next middleware in the stack
      Effect.flatMap(wrapped),
      // Log after
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
