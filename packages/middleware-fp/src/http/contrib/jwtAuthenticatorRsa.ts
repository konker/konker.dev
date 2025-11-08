import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/helpers';
import type { JwtVerificationConfigRsa } from '@konker.dev/tiny-auth-utils-fp/jwt/rsa';
import { jwtVerifyTokenRsa } from '@konker.dev/tiny-auth-utils-fp/jwt/rsa';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { HttpApiError } from '../HttpApiError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types.js';

const TAG = 'jwtAuthenticatorRsa';

// --------------------------------------------------------------------------
export const JwtAuthenticatorRsaDeps = Context.GenericTag<JwtVerificationConfigRsa>('JwtAuthenticatorRsaDeps');

export type WithUserId = {
  readonly userId: string | undefined;
};

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithUserId, O, E, R>
  ): RequestResponseHandler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R | JwtVerificationConfigRsa> =>
  (i: RequestW<I & WithNormalizedInputHeaders>) => {
    return pipe(
      Effect.Do,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.bind('deps', () => JwtAuthenticatorRsaDeps),
      Effect.bind('authToken', () => extractBearerToken(i.headers.authorization)),
      Effect.bind('verification', ({ authToken, deps }) => jwtVerifyTokenRsa(authToken, deps)),
      Effect.flatMap(({ verification }) =>
        verification.verified
          ? Effect.succeed(
              makeRequestW(i, {
                userId: verification.sub,
              })
            )
          : Effect.fail(void 0)
      ),
      Effect.mapError((e) =>
        HttpApiError('UnauthorizedError', `Invalid JWT RSA credentials: ${e?.message}`, 401, TAG, e)
      ),
      Effect.tapError((_) => Effect.logError(`UnauthorizedError: Invalid JWT RSA credentials: ${i.headers}`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
