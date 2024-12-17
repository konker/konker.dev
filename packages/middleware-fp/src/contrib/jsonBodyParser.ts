import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index.js';
import type { MiddlewareError } from '../lib/MiddlewareError.js';
import { toMiddlewareError } from '../lib/MiddlewareError.js';

const TAG = 'jsonBodyParser';

export type WithBody = { body?: string };
export type WithParsedBody = { body?: unknown; jsonParserRawBody: string | undefined };

export const middleware =
  () =>
  <I, O, E, R>(wrapped: Handler<I & WithParsedBody, O, E, R>): Handler<I & WithBody, O, E | MiddlewareError, R> =>
  (i: I & WithBody) =>
    pipe(
      // Lift the input
      Effect.succeed(i),
      // Log before
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      // JSON parse the body and add to input
      Effect.flatMap((i) => (i.body ? pipe(i.body, Schema.decode(Schema.parseJson())) : Effect.succeed(i.body))),
      Effect.mapError(toMiddlewareError),
      Effect.map((parsedBody) => ({
        ...i,
        body: parsedBody,
        jsonParserRawBody: i.body,
      })),
      // Call the next middleware in the stack
      Effect.flatMap(wrapped),
      // Log after
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
