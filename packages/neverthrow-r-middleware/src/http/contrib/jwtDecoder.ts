import { extractBearerToken } from '@konker.dev/neverthrow-r-auth-utils/helpers';
import { jwtDecodeToken } from '@konker.dev/neverthrow-r-auth-utils/jwt';
import { errAsync } from 'neverthrow';

import type { Handler } from '../../handler.js';
import type { WithLogger } from '../../lib/Logger.js';
import type { HttpApiError } from '../HttpApiError.js';
import { toHttpApiError } from '../HttpApiError.js';
import type { Override, Rec } from '../RequestResponseHandler.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types.js';

export const TAG = 'jwtDecoder';

export type WithUserId = {
  readonly userId: string | undefined;
};

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: Handler<RequestW<Override<I & WithNormalizedInputHeaders, WithUserId>>, R, ResponseW<O>, E>
  ): Handler<RequestW<I & WithNormalizedInputHeaders>, R & WithLogger, ResponseW<O>, E | HttpApiError> =>
  (i) =>
  (r) => {
    r.logger.debug(`[${TAG}] IN`);

    const decoded = extractBearerToken(i.headers.authorization)(undefined)
      .andThen((token) => jwtDecodeToken(token)(undefined))
      .mapErr((e) => toHttpApiError(e, 401, `Invalid JWT credentials: ${e instanceof Error ? e.message : String(e)}`));

    if (decoded.isErr()) {
      r.logger.error(decoded.error);
      return errAsync(decoded.error);
    }

    return wrapped(
      makeRequestW(i, {
        userId: typeof decoded.value.sub === 'string' ? decoded.value.sub : undefined,
      })
    )(r).map((res) => {
      r.logger.debug(`[${TAG}] OUT`);
      return res;
    });
  };
