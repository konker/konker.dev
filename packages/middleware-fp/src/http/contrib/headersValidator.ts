import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../RequestW.js';

const TAG = 'headersValidator';

export type WithValidatedHeaders<V> = {
  headers: V;
  headersValidatorRaw: RequestW['headers'] | undefined;
};

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithValidatedHeaders<V0>, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R> =>
  (i: RequestW<I>) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) =>
        pipe(i.headers, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      Effect.mapError((e) => toMiddlewareError(e)),
      Effect.map((validatedHeaders: V0) =>
        makeRequestW(i, {
          headers: validatedHeaders,
          headersValidatorRaw: i.headers,
        })
      ),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.withSpan(TAG)
    );
