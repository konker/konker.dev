import * as P from '@konker.dev/effect-ts-prelude';

import { basicAuthDecodeHeaderValue } from '@konker.dev/tiny-auth-utils-fp/dist/basic-auth';
import { basicAuthExtractEncoded } from '@konker.dev/tiny-auth-utils-fp/dist/helpers';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';
import type { WithNormalizedInputHeaders, WithUserId } from './headersNormalizer/types';

const TAG = 'basicAuthDecoder';

// --------------------------------------------------------------------------
export type { WithUserId } from './headersNormalizer/types';

export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I & WithUserId, O, E, R>
  ): Handler<I & WithNormalizedInputHeaders, O, E | MiddlewareError, R> =>
  (i: I & WithNormalizedInputHeaders) => {
    return P.pipe(
      P.Effect.Do,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.bind('authToken', () => basicAuthExtractEncoded(i.headers['authorization'])),
      P.Effect.bind('decoded', ({ authToken }) => basicAuthDecodeHeaderValue(authToken)),
      P.Effect.map(({ decoded }) => ({
        ...i,
        userId: decoded.username,
      })),
      P.Effect.mapError(toMiddlewareError),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
