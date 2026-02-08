import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../../index.js';
import type { RequestW } from '../../RequestW.js';
import { transformInput, transformOutput } from './lib.js';
import type { WithNormalizedInputHeaders, WithNormalizedOutputHeaders } from './types.js';

const TAG = 'headersNormalizer';

export const middleware =
  ({ normalizeRequestHeaders = true, normalizeResponseHeaders = true } = {}) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithNormalizedInputHeaders, O, E, R>
  ): RequestResponseHandler<I, O & WithNormalizedOutputHeaders, E, R> =>
  (i: RequestW<I>) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.map(transformInput(normalizeRequestHeaders)),
      Effect.flatMap(wrapped),
      Effect.map(transformOutput(normalizeResponseHeaders)),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.withSpan(TAG)
    );
  };
