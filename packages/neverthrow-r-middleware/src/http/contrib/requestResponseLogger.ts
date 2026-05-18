import { andThenAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger, tapLoggerWith } from '../../lib/Logger.js';
import type { Rec, RequestResponseHandler } from '../RequestResponseHandler.js';
import { type RequestW } from '../RequestW.js';

export const TAG = 'requestResponseLogger';

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E, R & WithLogger> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR<RequestW<I>>(i),
      tapLogger('debug', `[${TAG}] IN`),
      tapLoggerWith<RequestW<I>>('info', (req) => [`[${TAG}] REQUEST`, req]),
      andThenAsync(wrapped),
      tapLoggerWith('info', (res) => [`[${TAG}] RESPONSE`, res]),
      tapLogger('debug', `[${TAG}] OUT`)
    );
