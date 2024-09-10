import * as P from '@konker.dev/effect-ts-prelude';

import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/dist/helpers';
import type { JwtVerificationConfig } from '@konker.dev/tiny-auth-utils-fp/dist/jwt';
import { jwtVerifyToken } from '@konker.dev/tiny-auth-utils-fp/dist/jwt';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type { Handler } from '../index';
import { HttpApiError } from '../lib/HttpApiError';
import type { WithNormalizedInputHeaders, WithUserId } from './headersNormalizer/types';

const TAG = 'jwtAuthenticator';

// --------------------------------------------------------------------------
export const JwtAuthenticatorDeps = P.Context.GenericTag<JwtVerificationConfig>('JwtAuthenticatorDeps');

export type { WithUserId } from './headersNormalizer/types';

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I & WithUserId, O, E, R>
  ): Handler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R | JwtVerificationConfig> =>
  (i: I & WithNormalizedInputHeaders) => {
    return P.pipe(
      P.Effect.Do,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.bind('deps', () => JwtAuthenticatorDeps),
      P.Effect.bind('authToken', () => extractBearerToken(i.headers['authorization'])),
      P.Effect.bind('verification', ({ authToken, deps }) => jwtVerifyToken(authToken, deps)),
      P.Effect.flatMap(({ verification }) =>
        verification.verified
          ? P.Effect.succeed({
              ...i,
              userId: verification.sub,
            })
          : P.Effect.fail(void 0)
      ),
      P.Effect.mapError((e) =>
        HttpApiError('UnauthorizedError', `Invalid JWT credentials: ${e?.message}`, 401, TAG, e)
      ),
      P.Effect.tapError(P.Effect.logError),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
