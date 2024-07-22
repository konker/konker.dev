import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../../index';
import { transformInput, transformOutput } from './lib';
import type { WithNormalizedHeaders, WithPossibleHeaders, WithPossibleOutputHeaders } from './types';

const TAG = 'header-normalizer';

export const middleware =
  <I extends WithPossibleHeaders, WO, WE, WR>({
    normalizeRequestHeaders = true,
    normalizeResponseHeaders = true,
  } = {}) =>
  (wrapped: Handler<I & WithNormalizedHeaders, WO, WE, WR>): Handler<I, WO & WithPossibleOutputHeaders, WE, WR> =>
  (i: I) => {
    return P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.map(transformInput(normalizeRequestHeaders)),
      P.Effect.flatMap(wrapped),
      P.Effect.map(transformOutput(normalizeResponseHeaders)),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
