import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';
import type { RequestHeaders } from '../lib/http';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';
import type { WithPossibleInputHeaders } from './headersNormalizer/types';

const TAG = 'headersValidator';

export type WithValidatedHeaders<V> = {
  headers: V;
  validatorRawHeaders: RequestHeaders | undefined;
};

export const middleware =
  <V0, V1>(schema: Schema.Schema<V0, V1>) =>
  <I, O, E, R>(
    wrapped: Handler<I & WithValidatedHeaders<V0>, O, E, R>
  ): Handler<I & WithPossibleInputHeaders, O, E | MiddlewareError, R> =>
  (i: I & WithPossibleInputHeaders) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((i) =>
        pipe(i.headers, Schema.decodeUnknown(schema, { errors: 'all', onExcessProperty: 'ignore' }))
      ),
      Effect.mapError((e) => toMiddlewareError(e)),
      Effect.map((validatedHeaders: V0) => ({
        ...i,
        headers: validatedHeaders,
        validatorRawHeaders: i.headers,
      })),
      Effect.flatMap(wrapped)
    );
