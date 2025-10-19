import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import { type BodyRec, makeResponseW, type RequestResponseHandler, type StrBodyRec } from '../index.js';
import { makeRequestW, type RequestW } from '../RequestW.js';

const TAG = 'jsonBodyParser';

export type WithParsedBody = {
  readonly body: unknown;
  readonly jsonBodyParserRaw: string | undefined;
};

export const middleware =
  ({ encodeResponseBody = true } = {}) =>
  <I extends StrBodyRec, O extends BodyRec, E, R>(
    wrapped: RequestResponseHandler<I & WithParsedBody, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R> =>
  (i: RequestW<I>) =>
    pipe(
      // Lift the input
      Effect.succeed(i),
      // Log before
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      // JSON parse the body and add to input
      Effect.flatMap((i) => (i.body ? pipe(i.body, Schema.decode(Schema.parseJson())) : Effect.succeed(i.body))),
      Effect.mapError(toMiddlewareError),
      Effect.map((parsedBody) =>
        makeRequestW(i, {
          body: parsedBody,
          jsonBodyParserRaw: i.body,
        })
      ),

      // Call the next middleware in the stack
      Effect.flatMap(wrapped),

      // Encode the response body
      Effect.flatMap((o) =>
        o.body && encodeResponseBody
          ? pipe(
              o.body,
              Schema.encode(Schema.parseJson()),
              Effect.mapError(toMiddlewareError),
              Effect.map((encodedBody: string) => makeResponseW(o, { body: encodedBody }))
            )
          : Effect.succeed(o)
      ),

      // Log after
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
