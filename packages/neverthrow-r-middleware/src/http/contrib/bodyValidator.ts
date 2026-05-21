import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { middlewareError } from '../../lib/MiddlewareError.js';
import type { Override, Rec, RequestResponseHandler } from '../RequestResponseHandler.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import { makeResponseW } from '../ResponseW.js';

export const TAG = 'bodyValidator';

export type WithValidatedBody<V> = {
  readonly body: V;
  readonly bodyValidatorRaw: unknown;
};

export const middleware =
  <V>(schema: StandardSchemaV1<unknown, V>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<Override<I, WithValidatedBody<V>>, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R & WithLogger> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR<RequestW<I>>(i),
      tapLogger('debug', `[${TAG}] IN`),
      andThenAsync((req: RequestW<I>) => {
        const validation = (): ResultAsync<RequestW<Override<I, WithValidatedBody<V>>>, MiddlewareError> =>
          ResultAsync.fromSafePromise(Promise.resolve(schema['~standard'].validate(req.body))).andThen(
            (outcome: StandardSchemaV1.Result<V>) => {
              if ('issues' in outcome && outcome.issues !== undefined) {
                return errAsync(middlewareError('Body validation failed', outcome.issues));
              }
              const validated = outcome.value;
              return okAsync(
                makeRequestW(req, {
                  body: validated,
                  bodyValidatorRaw: req.body,
                })
              );
            }
          );
        return (_r: unknown) => validation();
      }),
      andThenAsync(wrapped),
      mapAsync((res) => makeResponseW(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
