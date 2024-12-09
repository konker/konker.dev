import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../../index';
import { transformInput, transformOutput } from './lib';
import type {
  WithNormalizedInputHeaders,
  WithNormalizedOutputHeaders,
  WithPossibleInputHeaders,
  WithPossibleOutputHeaders,
} from './types';

const TAG = 'headerNormalizer';

export const middleware =
  <I, O, E, R>({ normalizeRequestHeaders = true, normalizeResponseHeaders = true } = {}) =>
  (
    wrapped: Handler<I & WithNormalizedInputHeaders, O & WithPossibleOutputHeaders, E, R>
  ): Handler<I & WithPossibleInputHeaders, O & WithNormalizedOutputHeaders, E, R> =>
  (i: I & WithPossibleInputHeaders) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.map(transformInput(normalizeRequestHeaders)),
      Effect.flatMap(wrapped),
      Effect.map(transformOutput(normalizeResponseHeaders)),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
