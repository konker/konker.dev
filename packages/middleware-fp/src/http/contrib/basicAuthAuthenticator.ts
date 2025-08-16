import type { ValidBasicAuthCredentialSet } from '@konker.dev/tiny-auth-utils-fp/basic-auth';
import { basicAuthDecodeHeaderValue, basicAuthVerifyCredentials } from '@konker.dev/tiny-auth-utils-fp/basic-auth';
import { extractBasicAuthHeaderValue } from '@konker.dev/tiny-auth-utils-fp/helpers';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { HttpApiError } from '../HttpApiError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import type { RequestW } from '../request.js';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types.js';

const TAG = 'basicAuthAuthenticator';

// --------------------------------------------------------------------------
export type BasicAuthAuthenticatorDeps = {
  readonly validBasicAuthCredentialSet: ValidBasicAuthCredentialSet;
};
export const BasicAuthAuthenticatorDeps = Context.GenericTag<BasicAuthAuthenticatorDeps>('BasicAuthAuthenticatorDeps');

export type WithUserId = {
  readonly userId: string | undefined;
};

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & WithUserId, O, E, R>
  ): RequestResponseHandler<I & WithNormalizedInputHeaders, O, E | HttpApiError, R | BasicAuthAuthenticatorDeps> =>
  (i: RequestW<I & WithNormalizedInputHeaders>) => {
    return pipe(
      Effect.Do,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.bind('deps', () => BasicAuthAuthenticatorDeps),
      Effect.bind('authToken', () => extractBasicAuthHeaderValue(i.headers.authorization)),
      Effect.bind('decoded', ({ authToken }) => basicAuthDecodeHeaderValue(authToken)),
      Effect.bind('verification', ({ decoded, deps }) =>
        pipe(decoded, basicAuthVerifyCredentials(deps.validBasicAuthCredentialSet))
      ),
      Effect.flatMap(({ verification }) =>
        verification.verified
          ? Effect.succeed({
              ...i,
              userId: verification.userId,
            })
          : Effect.fail(void 0)
      ),
      Effect.mapError((e) =>
        HttpApiError('UnauthorizedError', `Invalid basic auth credentials: ${e?.message}`, 401, TAG, e)
      ),
      Effect.tapError(Effect.logError),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
