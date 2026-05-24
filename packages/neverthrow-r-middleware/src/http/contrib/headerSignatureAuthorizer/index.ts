import { errAsync } from 'neverthrow';

import type { Handler } from '../../../handler.js';
import type { WithLogger } from '../../../lib/Logger.js';
import { HttpApiError } from '../../HttpApiError.js';
import type { Rec } from '../../Rec.js';
import type { RequestW } from '../../RequestW.js';
import type { ResponseW } from '../../ResponseW.js';
import { validateHeaderSignature } from './lib.js';

export const TAG = 'headerSignatureAuthorizer';

export type HeaderSignatureAuthorizerDeps = {
  readonly secret: string;
  readonly signatureHeaderName: string;
};

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: Handler<RequestW<I>, R, ResponseW<O>, E>
  ): Handler<RequestW<I>, R & WithLogger & HeaderSignatureAuthorizerDeps, ResponseW<O>, E | HttpApiError> =>
  (i) =>
  (r) => {
    r.logger.debug(`[${TAG}] IN`);

    const gateResult = validateHeaderSignature(i.headers[r.signatureHeaderName], i.body, r.secret)(undefined);
    if (gateResult.isErr()) {
      r.logger.error(gateResult.error);
      return errAsync<ResponseW<O>, HttpApiError>(gateResult.error);
    }

    if (!gateResult.value) {
      const error = new HttpApiError({ statusCode: 401, message: 'Invalid signature' });
      r.logger.error(error);
      return errAsync<ResponseW<O>, HttpApiError>(error);
    }

    return wrapped(i)(r).map((res) => {
      r.logger.debug(`[${TAG}] OUT`);
      return res;
    });
  };
