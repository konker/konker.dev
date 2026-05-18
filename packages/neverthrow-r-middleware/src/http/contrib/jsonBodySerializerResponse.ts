import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { errAsyncR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { tryJsonStringify } from '../../lib/utils.js';
import type { BodyRec, RequestResponseHandler, StrBodyRec } from '../RequestResponseHandler.js';
import { type RequestW } from '../RequestW.js';
import { makeResponseW, type ResponseW } from '../ResponseW.js';

export const TAG = 'jsonBodySerializerResponse';

export type WithSerializedBody = {
  readonly body?: string;
};

export const middleware =
  () =>
  <I extends StrBodyRec, O extends BodyRec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O & WithSerializedBody, E | MiddlewareError, R & WithLogger> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR<RequestW<I>>(i),
      tapLogger('debug', `[${TAG}] IN`),
      andThenAsync(wrapped),
      andThenAsync((res: ResponseW<O>) => {
        if (res.body === undefined) {
          return okAsyncR<ResponseW<O & WithSerializedBody>, E | MiddlewareError>(
            makeResponseW(res, { body: '' }) as ResponseW<O & WithSerializedBody>
          );
        }
        return tryJsonStringify(res.body).match(
          (value) =>
            okAsyncR<ResponseW<O & WithSerializedBody>, E | MiddlewareError>(
              makeResponseW(res, { body: value }) as ResponseW<O & WithSerializedBody>
            ),
          (error) => errAsyncR<MiddlewareError, ResponseW<O & WithSerializedBody>>(error)
        );
      }),
      mapAsync((res) => makeResponseW(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
