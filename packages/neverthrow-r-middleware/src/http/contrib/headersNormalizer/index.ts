import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { WithLogger } from '../../../lib/Logger.js';
import { tapLogger } from '../../../lib/Logger.js';
import type { Override, Rec, RequestResponseHandler } from '../../RequestResponseHandler.js';
import type { RequestW } from '../../RequestW.js';
import { transformInput, transformOutput } from './lib.js';
import type { WithNormalizedInputHeaders, WithNormalizedOutputHeaders } from './types.js';

export const TAG = 'headersNormalizer';

export const middleware =
  ({ normalizeRequestHeaders = true, normalizeResponseHeaders = true } = {}) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<Override<I, WithNormalizedInputHeaders>, R, O, E>
  ): RequestResponseHandler<I, R & WithLogger, Override<O, WithNormalizedOutputHeaders>, E> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR(i),
      tapLogger('debug', `[${TAG}] IN`),
      mapAsync(transformInput(normalizeRequestHeaders)),
      andThenAsync(wrapped),
      mapAsync(transformOutput(normalizeResponseHeaders)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
