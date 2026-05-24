import { errAsync } from 'neverthrow';

import type { Handler } from '../../handler.js';
import type { WithLogger } from '../../lib/Logger.js';
import { HttpApiError } from '../HttpApiError.js';
import type { Rec } from '../Rec.js';
import { type RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'pathTokenAuthorizer';

export type PathTokenAuthorizerDeps = {
  readonly secretTokenEnvName: string;
  readonly pathParamName: string;
};

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: Handler<RequestW<I>, R, ResponseW<O>, E>
  ): Handler<RequestW<I>, R & WithLogger & PathTokenAuthorizerDeps, ResponseW<O>, E | HttpApiError> =>
  (i) =>
  (r) => {
    r.logger.debug(`[${TAG}] IN`);

    const secret = process.env[r.secretTokenEnvName];
    const actual = i.pathParameters?.[r.pathParamName];
    if (!secret || actual !== secret) {
      const error = new HttpApiError({ statusCode: 401, message: 'Invalid token' });
      r.logger.error(error);
      return errAsync<ResponseW<O>, HttpApiError>(error);
    }

    return wrapped(i)(r).map((res) => {
      r.logger.debug(`[${TAG}] OUT`);
      return res;
    });
  };
