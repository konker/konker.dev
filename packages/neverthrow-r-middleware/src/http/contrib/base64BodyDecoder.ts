import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import { fromPromise } from '../../lib/utils.js';
import type { Rec, RequestResponseHandler, StrBodyRec } from '../RequestResponseHandler.js';
import type { RequestW } from '../RequestW.js';
import { makeResponseW } from '../ResponseW.js';

export const TAG = 'base64BodyDecoder';

export const middleware =
  <I extends Rec>(isBase64Encoded: (i: RequestW<I>) => boolean) =>
  <O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I & StrBodyRec, R, O, E>
  ): RequestResponseHandler<I & StrBodyRec, R & WithLogger, O, E | MiddlewareError> =>
  (i: RequestW<I & StrBodyRec>) =>
    pipe(
      okAsyncR(i),
      tapLogger('debug', `[${TAG}] IN`),
      andThenAsync(
        (req) => () =>
          fromPromise(
            async (): Promise<RequestW<I & StrBodyRec>> =>
              isBase64Encoded(req)
                ? {
                    ...req,
                    body: Buffer.from(req.body ?? '', 'base64').toString('utf-8'),
                  }
                : { ...req },
            toMiddlewareError
          )
      ),
      andThenAsync(wrapped),
      mapAsync((res) => makeResponseW(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
