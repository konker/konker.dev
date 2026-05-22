import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { errAsyncR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { tryJsonParse } from '../../lib/utils.js';
import type { BodyRec, Override, RequestResponseHandler, StrBodyRec } from '../RequestResponseHandler.js';
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
    wrapped: RequestResponseHandler<Override<I, WithParsedBody>, R, O, E>
  ): RequestResponseHandler<I, R & WithLogger, O, E | MiddlewareError> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR(i),
      tapLogger('debug', `[${TAG}] IN`),
      andThenAsync((req: RequestW<I>) => {
        const raw = req.body;
        if (raw === undefined || raw === '') {
          return okAsyncR(
            makeRequestW(req, {
              body: undefined as unknown,
              jsonBodyParserRaw: raw,
            })
          );
        }
        return tryJsonParse(raw).match(
          (value) =>
            okAsyncR(
              makeRequestW(req, {
                body: value,
                jsonBodyParserRaw: raw,
              })
            ),
          (error) => errAsyncR(error)
        );
      }),
      andThenAsync(wrapped),
      mapAsync((res) => makeResponseW(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
