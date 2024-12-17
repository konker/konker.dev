import { basicAuthDecodeHeaderValue } from '@konker.dev/tiny-auth-utils-fp/basic-auth';
import { extractBasicAuthHeaderValue } from '@konker.dev/tiny-auth-utils-fp/helpers';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index.js';
import type { MiddlewareError } from '../lib/MiddlewareError.js';
import { toMiddlewareError } from '../lib/MiddlewareError.js';
import type { WithNormalizedInputHeaders, WithUserId } from './headersNormalizer/types.js';

const TAG = 'basicAuthDecoder';

// --------------------------------------------------------------------------
export type { WithUserId } from './headersNormalizer/types.js';

export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I & WithUserId, O, E, R>
  ): Handler<I & WithNormalizedInputHeaders, O, E | MiddlewareError, R> =>
  (i: I & WithNormalizedInputHeaders) => {
    return pipe(
      Effect.Do,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.bind('authToken', () => extractBasicAuthHeaderValue(i.headers.authorization)),
      Effect.bind('decoded', ({ authToken }) => basicAuthDecodeHeaderValue(authToken)),
      Effect.map(({ decoded }) => ({
        ...i,
        userId: decoded.username,
      })),
      Effect.mapError(toMiddlewareError),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
