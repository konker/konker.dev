import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'jsonBodyParser';

export type WithBody = { body?: string };
export type WithParsedBody = { body?: unknown; jsonParserRawBody: string | undefined };

export const middleware =
  () =>
  <I, O, E, R>(wrapped: Handler<I & WithParsedBody, O, E, R>): Handler<I & WithBody, O, E | MiddlewareError, R> =>
  (i: I & WithBody) =>
    P.pipe(
      // Lift the input
      P.Effect.succeed(i),
      // Log before
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      // JSON parse the body and add to input
      P.Effect.flatMap((i) =>
        i.body ? P.pipe(i.body, P.Schema.decode(P.Schema.parseJson())) : P.Effect.succeed(i.body)
      ),
      P.Effect.mapError(toMiddlewareError),
      P.Effect.map((parsedBody) => ({
        ...i,
        body: parsedBody,
        jsonParserRawBody: i.body,
      })),
      // Call the next middleware in the stack
      P.Effect.flatMap(wrapped),
      // Log after
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
