import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'envValidator';

export type WithValidatedEnv<V> = {
  validatedEnv: V;
};

export const middleware =
  <V0, V1>(schema: P.Schema.Schema<V0, V1>) =>
  <I, O, E, R>(wrapped: Handler<I & WithValidatedEnv<V0>, O, E, R>): Handler<I, O, E | MiddlewareError, R> =>
  (i: I) =>
    P.pipe(
      // Lift the input
      P.Effect.succeed(i),
      // Log before
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      // Parse the environment according to the given schema and inject into input
      P.Effect.flatMap((_) =>
        P.pipe(process.env, P.Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      P.Effect.mapError(toMiddlewareError),
      P.Effect.map((validatedEnv: V0) => ({
        ...i,
        validatedEnv,
      })),
      // Call the next middleware in the stack
      P.Effect.flatMap(wrapped),
      // Log after
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
