import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/error';
import { toMiddlewareError } from '../lib/error';

const TAG = 'json-body-parser';

export type WithBody = { body?: string };
export type WithParsedBody = { parsedBody: unknown };

export const middleware =
  <WO, WE, WR, I extends WithBody>(
    wrapped: Handler<I & WithParsedBody, WO, WE, WR>
  ): Handler<I, WO, WE | MiddlewareError, WR> =>
  (i: I) =>
    P.pipe(
      // Lift the input
      P.Effect.succeed(i),
      // Log before
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      // JSON parse the body and add to input
      P.Effect.flatMap((i) => P.pipe(i.body ?? '', P.Schema.decode(P.Schema.parseJson()))),
      P.Effect.mapError(toMiddlewareError),
      P.Effect.map((parsedBody) => ({
        ...i,
        parsedBody,
      })),
      // Call the next middleware in the stack
      P.Effect.flatMap(wrapped),
      // Log after
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
