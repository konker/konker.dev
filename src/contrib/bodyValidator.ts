import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'bodyValidator';

export type WithBody = { body?: unknown };
export type WithValidatedBody<V> = { body: V; validatorRawBody: unknown };

export const middleware =
  <V>(schema: P.Schema.Schema<V>) =>
  <WI, WO, WE, WR>(
    wrapped: Handler<WI & WithValidatedBody<V>, WO, WE, WR>
  ): Handler<WI & WithBody, WO, WE | MiddlewareError, WR> =>
  (i: WI & WithBody) =>
    P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((i) =>
        P.pipe(i.body, P.Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      P.Effect.mapError((e) => toMiddlewareError(e)),
      P.Effect.map((validatedBody: V) => ({
        ...i,
        body: validatedBody,
        validatorRawBody: i.body,
      })),
      P.Effect.flatMap(wrapped)
    );
