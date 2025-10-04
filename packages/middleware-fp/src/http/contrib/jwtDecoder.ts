import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/helpers';
import { jwtDecodeToken } from '@konker.dev/tiny-auth-utils-fp/jwt';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { HttpApiError } from '../HttpApiError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types.js';

const TAG = 'jwtDecoder';

// --------------------------------------------------------------------------
export type WithUserId = {
  readonly userId: string | undefined;
};

// --------------------------------------------------------------------------

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithUserId, O, E, R>
  ): RequestResponseHandler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R> =>
  (i: RequestW<I & WithNormalizedInputHeaders>) => {
    return pipe(
      Effect.Do,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.bind('authToken', () => extractBearerToken(i.headers.authorization)),
      Effect.bind('decoded', ({ authToken }) => jwtDecodeToken(authToken)),
      Effect.map(({ decoded }) =>
        makeRequestW(i, {
          userId: decoded.sub,
        })
      ),
      Effect.mapError((e) => HttpApiError('UnauthorizedError', `Invalid JWT credentials: ${e.message}`, 401, TAG, e)),
      Effect.tapError((_) => Effect.logError(`UnauthorizedError: Invalid JWT credentials: ${i.headers}`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
