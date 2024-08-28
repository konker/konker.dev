import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../../index';
import { transformInput, transformOutput } from './lib';
import type { WithNormalizedHeaders, WithPossibleInputHeaders, WithPossibleOutputHeaders } from './types';

const TAG = 'headerNormalizer';

export const middleware =
  <WI, WO, WE, WR>({ normalizeRequestHeaders = true, normalizeResponseHeaders = true } = {}) =>
  (
    wrapped: Handler<WI & WithNormalizedHeaders, WO, WE, WR>
  ): Handler<WI & WithPossibleInputHeaders, WO & WithPossibleOutputHeaders, WE, WR> =>
  (i: WI & WithPossibleInputHeaders) => {
    return P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.map(transformInput(normalizeRequestHeaders)),
      P.Effect.flatMap(wrapped),
      P.Effect.map(transformOutput(normalizeResponseHeaders)),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
