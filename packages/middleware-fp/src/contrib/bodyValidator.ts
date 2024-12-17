import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index.js';
import type { MiddlewareError } from '../lib/MiddlewareError.js';
import { toMiddlewareError } from '../lib/MiddlewareError.js';

const TAG = 'bodyValidator';

export type WithBody = { body?: unknown };
export type WithValidatedBody<V> = { body: V; validatorRawBody: unknown };

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I, O, E, R>(
    wrapped: Handler<I & WithValidatedBody<V0>, O, E, R>
  ): Handler<I & WithBody, O, E | MiddlewareError, R> =>
  (i: I & WithBody) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) => pipe(i.body, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))),
      Effect.mapError((e) => toMiddlewareError(e)),
      Effect.map((validatedBody: V0) => ({
        ...i,
        body: validatedBody,
        validatorRawBody: i.body,
      })),
      Effect.flatMap(wrapped)
    );
