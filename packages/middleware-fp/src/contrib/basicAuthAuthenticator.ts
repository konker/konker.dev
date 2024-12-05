import * as P from '@konker.dev/effect-ts-prelude';

import type { ValidBasicAuthCredentialSet } from '@konker.dev/tiny-auth-utils-fp/dist/basic-auth';
import { basicAuthDecodeHeaderValue, basicAuthVerifyCredentials } from '@konker.dev/tiny-auth-utils-fp/dist/basic-auth';
import { extractBasicAuthHeaderValue } from '@konker.dev/tiny-auth-utils-fp/dist/helpers';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type { Handler } from '../index';
import { HttpApiError } from '../lib/HttpApiError';
import type { WithNormalizedInputHeaders, WithUserId } from './headersNormalizer/types';

const TAG = 'basicAuthAuthenticator';

// --------------------------------------------------------------------------
export type BasicAuthAuthenticatorDeps = {
  readonly validBasicAuthCredentialSet: ValidBasicAuthCredentialSet;
};
export const BasicAuthAuthenticatorDeps =
  P.Context.GenericTag<BasicAuthAuthenticatorDeps>('BasicAuthAuthenticatorDeps');

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I & WithUserId, O, E, R>
  ): Handler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R | BasicAuthAuthenticatorDeps> =>
  (i: I & WithNormalizedInputHeaders) => {
    return P.pipe(
      P.Effect.Do,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.bind('deps', () => BasicAuthAuthenticatorDeps),
      P.Effect.bind('authToken', () => extractBasicAuthHeaderValue(i.headers['authorization'])),
      P.Effect.bind('decoded', ({ authToken }) => basicAuthDecodeHeaderValue(authToken)),
      P.Effect.bind('verification', ({ decoded, deps }) =>
        P.pipe(decoded, basicAuthVerifyCredentials(deps.validBasicAuthCredentialSet))
      ),
      P.Effect.flatMap(({ verification }) =>
        verification.verified
          ? P.Effect.succeed({
              ...i,
              userId: verification.userId,
            })
          : P.Effect.fail(void 0)
      ),
      P.Effect.mapError((e) =>
        HttpApiError('UnauthorizedError', `Invalid basic auth credentials: ${e?.message}`, 401, TAG, e)
      ),
      P.Effect.tapError(P.Effect.logError),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
