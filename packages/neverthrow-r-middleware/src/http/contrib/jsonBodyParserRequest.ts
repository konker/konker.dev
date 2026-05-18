import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { errAsyncR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { tryJsonParse } from '../../lib/utils.js';
import type { BodyRec, RequestResponseHandler, StrBodyRec } from '../RequestResponseHandler.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import { makeResponseW } from '../ResponseW.js';

export const TAG = 'jsonBodyParserRequest';

export type WithParsedBody = {
  readonly body: unknown;
  readonly jsonBodyParserRaw: string | undefined;
};

export const middleware =
  () =>
  <I extends StrBodyRec, O extends BodyRec, E, R>(
    wrapped: RequestResponseHandler<I & WithParsedBody, O, E, R>
  ): RequestResponseHandler<I, O, E | MiddlewareError, R & WithLogger> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR<RequestW<I>>(i),
      tapLogger('debug', `[${TAG}] IN`),
      andThenAsync((req: RequestW<I>) => {
        const raw = req.body;
        if (raw === undefined || raw === '') {
          return okAsyncR<RequestW<I & WithParsedBody>, E | MiddlewareError>(
            makeRequestW(req, {
              body: undefined,
              jsonBodyParserRaw: undefined,
            }) as RequestW<I & WithParsedBody>
          );
        }
        return tryJsonParse(raw).match(
          (value) =>
            okAsyncR<RequestW<I & WithParsedBody>, E | MiddlewareError>(
              makeRequestW(req, {
                body: value,
                jsonBodyParserRaw: raw,
              }) as RequestW<I & WithParsedBody>
            ),
          (error) => errAsyncR<MiddlewareError, RequestW<I & WithParsedBody>>(error)
        );
      }),
      andThenAsync(wrapped),
      mapAsync((res) => makeResponseW(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
