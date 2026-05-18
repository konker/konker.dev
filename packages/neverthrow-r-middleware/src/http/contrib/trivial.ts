import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { Rec, RequestResponseHandler } from '../RequestResponseHandler.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import { makeResponseW } from '../ResponseW.js';

export const TAG = 'trivial';

export const middleware =
  (_params?: never) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E, R & WithLogger> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR<RequestW<I>>(i),
      tapLogger('debug', `[${TAG}] IN`),
      mapAsync((req) => makeRequestW(req)),
      andThenAsync(wrapped),
      mapAsync((res) => makeResponseW(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
