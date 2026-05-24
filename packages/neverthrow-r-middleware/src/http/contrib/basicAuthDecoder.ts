import { basicAuthDecodeHeaderValue } from '@konker.dev/neverthrow-r-auth-utils/basic-auth';
import { extractBasicAuthHeaderValue } from '@konker.dev/neverthrow-r-auth-utils/helpers';
import { errAsync } from 'neverthrow';

import type { Handler } from '../../handler.js';
import type { WithLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import type { Override, Rec } from '../RequestResponseHandler.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types.js';

export const TAG = 'basicAuthDecoder';

export type WithUserId = {
  readonly userId: string | undefined;
};

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: Handler<RequestW<Override<I & WithNormalizedInputHeaders, WithUserId>>, R, ResponseW<O>, E>
  ): Handler<RequestW<I & WithNormalizedInputHeaders>, R & WithLogger, ResponseW<O>, E | MiddlewareError> =>
  (i) =>
  (r) => {
    r.logger.debug(`[${TAG}] IN`);

    const decoded = extractBasicAuthHeaderValue(i.headers.authorization)(undefined)
      .andThen((headerValue) => basicAuthDecodeHeaderValue(headerValue)(undefined))
      .mapErr(toMiddlewareError);

    if (decoded.isErr()) {
      r.logger.error(decoded.error);
      return errAsync(decoded.error);
    }

    return wrapped(
      makeRequestW(i, {
        userId: decoded.value.username,
      })
    )(r).map((res) => {
      r.logger.debug(`[${TAG}] OUT`);
      return res;
    });
  };
