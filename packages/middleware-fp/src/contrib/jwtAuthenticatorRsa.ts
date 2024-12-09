import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/dist/helpers';
import type { JwtVerificationConfigRsa } from '@konker.dev/tiny-auth-utils-fp/dist/jwt/rsa';
import { jwtVerifyTokenRsa } from '@konker.dev/tiny-auth-utils-fp/dist/jwt/rsa';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';
import { HttpApiError } from '../lib/HttpApiError';
import type { WithNormalizedInputHeaders, WithUserId } from './headersNormalizer/types';

const TAG = 'jwtAuthenticatorRsa';

// --------------------------------------------------------------------------
export const JwtAuthenticatorRsaDeps = Context.GenericTag<JwtVerificationConfigRsa>('JwtAuthenticatorRsaDeps');

export type { WithUserId } from './headersNormalizer/types';

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I & WithUserId, O, E, R>
  ): Handler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R | JwtVerificationConfigRsa> =>
  (i: I & WithNormalizedInputHeaders) => {
    return pipe(
      Effect.Do,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.bind('deps', () => JwtAuthenticatorRsaDeps),
      Effect.bind('authToken', () => extractBearerToken(i.headers['authorization'])),
      Effect.bind('verification', ({ authToken, deps }) => jwtVerifyTokenRsa(authToken, deps)),
      Effect.flatMap(({ verification }) =>
        verification.verified
          ? Effect.succeed({
              ...i,
              userId: verification.sub,
            })
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
