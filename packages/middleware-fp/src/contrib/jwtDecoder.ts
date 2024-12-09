import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/dist/helpers';
import { jwtDecodeToken } from '@konker.dev/tiny-auth-utils-fp/dist/jwt';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';
import { HttpApiError } from '../lib/HttpApiError';
import type { WithNormalizedInputHeaders, WithUserId } from './headersNormalizer/types';

const TAG = 'jwtDecoder';

// --------------------------------------------------------------------------
export type { WithUserId } from './headersNormalizer/types';

// --------------------------------------------------------------------------

export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I & WithUserId, O, E, R>
  ): Handler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R> =>
  (i: I & WithNormalizedInputHeaders) => {
    return pipe(
      Effect.Do,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.bind('authToken', () => extractBearerToken(i.headers['authorization'])),
      Effect.bind('decoded', ({ authToken }) => jwtDecodeToken(authToken)),
      Effect.map(({ decoded }) => ({
        ...i,
        userId: decoded.sub,
      })),
      Effect.mapError((e) => HttpApiError('UnauthorizedError', `Invalid JWT credentials: ${e.message}`, 401, TAG, e)),
      Effect.tapError((_) => Effect.logError(`UnauthorizedError: Invalid JWT credentials: ${i.headers}`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
