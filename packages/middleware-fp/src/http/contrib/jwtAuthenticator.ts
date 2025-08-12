import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/helpers';
import type { JwtVerificationConfig } from '@konker.dev/tiny-auth-utils-fp/jwt';
import { jwtVerifyToken } from '@konker.dev/tiny-auth-utils-fp/jwt';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { HttpApiError } from '../HttpApiError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../request.js';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types.js';

const TAG = 'jwtAuthenticator';

// --------------------------------------------------------------------------
export const JwtAuthenticatorDeps = Context.GenericTag<JwtVerificationConfig>('JwtAuthenticatorDeps');

// FIXME: extract these WithUserId types into common def
export type WithUserId = {
  readonly userId: string | undefined;
};

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithUserId, O, E, R>
  ): RequestResponseHandler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R | JwtVerificationConfig> =>
  (i: RequestW<I & WithNormalizedInputHeaders>) => {
    return pipe(
      Effect.Do,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.bind('deps', () => JwtAuthenticatorDeps),
      Effect.bind('authToken', () => extractBearerToken(i.headers.authorization)),
      Effect.bind('verification', ({ authToken, deps }) => jwtVerifyToken(authToken, deps)),
      Effect.flatMap(({ verification }) =>
        verification.verified
          ? Effect.succeed(
              makeRequestW(i, {
                userId: verification.sub,
              })
            )
          : Effect.fail(void 0)
      ),
      Effect.mapError((e) => HttpApiError('UnauthorizedError', `Invalid JWT credentials: ${e?.message}`, 401, TAG, e)),
      Effect.tapError(Effect.logError),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
