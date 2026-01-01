import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import { type BodyRec, makeResponseW, type RequestResponseHandler, type StrBodyRec } from '../index.js';
import { type RequestW } from '../RequestW.js';

const TAG = 'jsonBodySerializerResponse';

export type WithSerializedBody = {
  readonly body?: string;
};

export const middleware =
  () =>
  <I extends StrBodyRec, O extends BodyRec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O & WithSerializedBody, E | MiddlewareError, R> =>
  (i: RequestW<I>) =>
    pipe(
      // Lift the input
      Effect.succeed(i),
      // Log before
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),

      // Call the next middleware in the stack
      Effect.flatMap(wrapped),

      // Encode the response body
      Effect.flatMap((o) =>
        o.body
          ? pipe(
              o.body,
              Schema.encode(Schema.parseJson()),
              Effect.mapError(toMiddlewareError),
              Effect.map((encodedBody: string) => makeResponseW(o, { body: encodedBody })),
              (x) => x
            )
          : Effect.succeed(makeResponseW(o, { body: '' }))
      ),

      // Log after
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
