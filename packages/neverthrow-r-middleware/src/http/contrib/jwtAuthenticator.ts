import { extractBearerToken } from '@konker.dev/neverthrow-r-auth-utils/helpers';
import type { JwtVerificationConfig } from '@konker.dev/neverthrow-r-auth-utils/jwt';
import { jwtVerifyToken } from '@konker.dev/neverthrow-r-auth-utils/jwt';
import { errAsync } from 'neverthrow';

import type { Handler } from '../../handler.js';
import type { WithLogger } from '../../lib/Logger.js';
import type { HttpApiError } from '../HttpApiError.js';
import { toHttpApiError } from '../HttpApiError.js';
import type { Rec } from '../Rec.js';
import { type RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types.js';

export const TAG = 'jwtAuthenticator';

export type JwtAuthenticatorDeps = JwtVerificationConfig;

export type WithUserId = {
  readonly userId: string | undefined;
};

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: Handler<RequestW<I & WithNormalizedInputHeaders & WithUserId>, R, ResponseW<O>, E>
  ): Handler<
    RequestW<I & WithNormalizedInputHeaders>,
    R & WithLogger & JwtAuthenticatorDeps,
    ResponseW<O>,
    E | HttpApiError
  > =>
  (i) =>
  (r) => {
    r.logger.debug(`[${TAG}] IN`);

    const authResult = extractBearerToken(i.headers.authorization)(undefined).andThen((authToken) =>
      jwtVerifyToken(authToken, r)(undefined)
    );

    if (authResult.isErr()) {
      const error = toHttpApiError(
        authResult.error,
        401,
        `Invalid JWT credentials: ${authResult.error instanceof Error ? authResult.error.message : String(authResult.error)}`
      );
      r.logger.error(error);
      return errAsync<ResponseW<O>, E | HttpApiError>(error);
    }

    if (!authResult.value.verified) {
      const error = toHttpApiError(undefined, 401, 'Invalid JWT credentials');
      r.logger.error(error);
      return errAsync<ResponseW<O>, E | HttpApiError>(error);
    }

    return wrapped({
      ...i,
      userId: authResult.value.sub,
    } as RequestW<I & WithNormalizedInputHeaders & WithUserId>)(r).map((res) => {
      r.logger.debug(`[${TAG}] OUT`);
      return res;
    });
  };
