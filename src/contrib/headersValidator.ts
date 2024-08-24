import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'headers-validator';

export type WithNormalizedHeaders = {
  normalizedHeaders: Record<string, string | undefined>;
};
export type WithValidatedNormalizedHeaders<V> = {
  validatedNormalizedHeaders: V;
};

export const middleware =
  <V>(schema: P.Schema.Schema<V>) =>
  <WI, WO, WE, WR>(
    wrapped: Handler<WI & WithValidatedNormalizedHeaders<V>, WO, WE, WR>
  ): Handler<WI & WithNormalizedHeaders, WO, WE | MiddlewareError, WR> =>
  (i: WI & WithNormalizedHeaders) =>
    P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((i) =>
        P.pipe(i.normalizedHeaders, P.Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      P.Effect.mapError((e) => toMiddlewareError(e)),
      P.Effect.map((validatedNormalizedHeaders: V) => ({
        ...i,
        validatedNormalizedHeaders,
      })),
      P.Effect.flatMap(wrapped)
    );
