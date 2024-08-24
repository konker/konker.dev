import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'body-validator';

export type WithParsedBody = { parsedBody: unknown }; //[XXX: alias for json-body-parser IAfter?]
export type WithValidatedBody<V> = { validatedBody: V };

export const middleware =
  <V>(schema: P.Schema.Schema<V>) =>
  <WI, WO, WE, WR>(
    wrapped: Handler<WI & WithValidatedBody<V>, WO, WE, WR>
  ): Handler<WI & WithParsedBody, WO, WE | MiddlewareError, WR> =>
  (i: WI & WithParsedBody) =>
    P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((i) =>
        P.pipe(i.parsedBody, P.Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      P.Effect.mapError((e) => toMiddlewareError(e)),
      P.Effect.map((validatedBody: V) => ({
        ...i,
        validatedBody,
      })),
      P.Effect.flatMap(wrapped)
    );
