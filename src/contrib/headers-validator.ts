import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/error';
import { toMiddlewareError } from '../lib/error';

const TAG = 'headers-validator';

export type WithNormalizedHeaders = {
  normalizedHeaders: Record<string, string | undefined>;
};
export type WithValidatedNormalizedHeaders<V> = {
  validatedNormalizedHeaders: V;
};

export const middleware =
  <V>(schema: P.Schema.Schema<V>) =>
  <I extends WithNormalizedHeaders, WO, WE, WR>(
    wrapped: Handler<I & WithValidatedNormalizedHeaders<V>, WO, WE, WR>
  ): Handler<I, WO, WE | MiddlewareError, WR> =>
  (mi: I) =>
    P.pipe(
      P.Effect.succeed(mi),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((i) =>
        P.pipe(i.normalizedHeaders, P.Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      P.Effect.mapError((e) => toMiddlewareError(e)),
      P.Effect.map((validatedNormalizedHeaders: V) => ({
        ...mi,
        validatedNormalizedHeaders,
      })),
      P.Effect.flatMap(wrapped)
    );
