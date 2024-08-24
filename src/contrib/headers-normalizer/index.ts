import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../../index';
import { transformInput, transformOutput } from './lib';
import type { WithNormalizedHeaders, WithPossibleHeaders, WithPossibleOutputHeaders } from './types';

const TAG = 'header-normalizer';

export const middleware =
  <WI extends WithPossibleHeaders, WO, WE, WR>({
    normalizeRequestHeaders = true,
    normalizeResponseHeaders = true,
  } = {}) =>
  (wrapped: Handler<WI & WithNormalizedHeaders, WO, WE, WR>): Handler<WI, WO & WithPossibleOutputHeaders, WE, WR> =>
  (i: WI) => {
    return P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.map(transformInput(normalizeRequestHeaders)),
      P.Effect.flatMap(wrapped),
      P.Effect.map(transformOutput(normalizeResponseHeaders)),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
