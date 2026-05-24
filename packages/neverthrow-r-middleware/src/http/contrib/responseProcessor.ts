import { okAsync } from 'neverthrow';

import type { Handler } from '../../handler.js';
import type { WithLogger } from '../../lib/Logger.js';
import { toErrorResponseW, toHttpApiError } from '../HttpApiError.js';
import type { Rec } from '../Rec.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'responseProcessor';

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: Handler<RequestW<I>, R, ResponseW<O>, E>
  ): Handler<RequestW<I>, R & WithLogger, ResponseW<O | {}>, never> =>
  (i) =>
  (r) => {
    r.logger.debug(`[${TAG}] IN`);

    return wrapped(i)(r)
      .map((res) => {
        r.logger.debug(`[${TAG}] OUT`);
        return res;
      })
      .orElse((e) => {
        r.logger.error(e);
        return okAsync(toErrorResponseW(toHttpApiError(e)));
      });
  };
