import * as P from '@konker.dev/effect-ts-prelude';

import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/dist/helpers';
import type { JwtVerificationConfigRsa } from '@konker.dev/tiny-auth-utils-fp/dist/jwt/rsa';
import { jwtVerifyTokenRsa } from '@konker.dev/tiny-auth-utils-fp/dist/jwt/rsa';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type { Handler } from '../index';
import { HttpApiError } from '../lib/HttpApiError';
import type { WithNormalizedInputHeaders, WithUserId } from './headersNormalizer/types';

const TAG = 'jwtAuthenticatorRsa';

// --------------------------------------------------------------------------
export const JwtAuthenticatorRsaDeps = P.Context.GenericTag<JwtVerificationConfigRsa>('JwtAuthenticatorRsaDeps');

export type { WithUserId } from './headersNormalizer/types';

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I & WithUserId, O, E, R>
  ): Handler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R | JwtVerificationConfigRsa> =>
  (i: I & WithNormalizedInputHeaders) => {
    return P.pipe(
      P.Effect.Do,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.bind('deps', () => JwtAuthenticatorRsaDeps),
      P.Effect.bind('authToken', () => extractBearerToken(i.headers['authorization'])),
      P.Effect.bind('verification', ({ authToken, deps }) => jwtVerifyTokenRsa(authToken, deps)),
      P.Effect.flatMap(({ verification }) =>
        verification.verified
          ? P.Effect.succeed({
              ...i,
              userId: verification.sub,
            })
          : P.Effect.fail(void 0)
      ),
      P.Effect.mapError((e) =>
        HttpApiError('UnauthorizedError', `Invalid JWT RSA credentials: ${e?.message}`, 401, TAG, e)
      ),
      P.Effect.tapError((_) => P.Effect.logError(`UnauthorizedError: Invalid JWT RSA credentials: ${i.headers}`)),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
