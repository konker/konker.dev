import * as P from '@konker.dev/effect-ts-prelude';

import { extractBearerToken } from '@konker.dev/tiny-auth-utils-fp/dist/helpers';
import { jwtDecodeToken } from '@konker.dev/tiny-auth-utils-fp/dist/jwt';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

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
    return P.pipe(
      P.Effect.Do,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.bind('authToken', () => extractBearerToken(i.headers['authorization'])),
      P.Effect.bind('decoded', ({ authToken }) => jwtDecodeToken(authToken)),
      P.Effect.map(({ decoded }) => ({
        ...i,
        userId: decoded.sub,
      })),
      P.Effect.mapError((e) => HttpApiError('UnauthorizedError', `Invalid JWT credentials: ${e.message}`, 401, TAG, e)),
      P.Effect.tapError((_) => P.Effect.logError(`UnauthorizedError: Invalid JWT credentials: ${i.headers}`)),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
