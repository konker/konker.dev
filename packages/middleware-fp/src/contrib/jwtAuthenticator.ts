import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/dist/helpers';
import type { JwtVerificationConfig } from '@konker.dev/tiny-auth-utils-fp/dist/jwt';
import { jwtVerifyToken } from '@konker.dev/tiny-auth-utils-fp/dist/jwt';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';
import { HttpApiError } from '../lib/HttpApiError';
import type { WithNormalizedInputHeaders, WithUserId } from './headersNormalizer/types';

const TAG = 'jwtAuthenticator';

// --------------------------------------------------------------------------
export const JwtAuthenticatorDeps = Context.GenericTag<JwtVerificationConfig>('JwtAuthenticatorDeps');

export type { WithUserId } from './headersNormalizer/types';

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I & WithUserId, O, E, R>
  ): Handler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R | JwtVerificationConfig> =>
  (i: I & WithNormalizedInputHeaders) => {
    return pipe(
      Effect.Do,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.bind('deps', () => JwtAuthenticatorDeps),
      Effect.bind('authToken', () => extractBearerToken(i.headers['authorization'])),
      Effect.bind('verification', ({ authToken, deps }) => jwtVerifyToken(authToken, deps)),
      Effect.flatMap(({ verification }) =>
        verification.verified
          ? Effect.succeed({
              ...i,
              userId: verification.sub,
            })
          : Effect.fail(void 0)
      ),
      Effect.mapError((e) => HttpApiError('UnauthorizedError', `Invalid JWT credentials: ${e?.message}`, 401, TAG, e)),
      Effect.tapError(Effect.logError),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
