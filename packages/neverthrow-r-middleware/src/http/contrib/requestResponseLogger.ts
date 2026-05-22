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
    wrapped: RequestResponseHandler<I, R, O, E>
  ): RequestResponseHandler<I, R & WithLogger, O, E> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR(i),
      tapLogger('debug', `[${TAG}] IN`),
      tapLoggerWith('info', (req) => [`[${TAG}] REQUEST`, req]),
      andThenAsync(wrapped),
      tapLoggerWith('info', (res) => [`[${TAG}] RESPONSE`, res]),
      tapLogger('debug', `[${TAG}] OUT`)
    );
