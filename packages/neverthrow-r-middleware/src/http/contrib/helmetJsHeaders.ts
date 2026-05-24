import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { Rec, RequestResponseHandler } from '../RequestResponseHandler.js';
import type { RequestW } from '../RequestW.js';

export const TAG = 'helmetJsHeaders';

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, R, O, E>
  ): RequestResponseHandler<I, R & WithLogger, O, E> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR(i),
      tapLogger('debug', `[${TAG}] IN`),
      andThenAsync(wrapped),
      mapAsync((x) => ({
        ...x,
        headers: {
          'Content-Security-Policy':
            "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Resource-Policy': 'same-origin',
          'Origin-Agent-Cluster': '?1',
          'Referrer-Policy': 'no-referrer',
          'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
          'X-Content-Type-Options': 'nosniff',
          'X-DNS-Prefetch-Control': 'off',
          'X-Download-Options': 'noopen',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Permitted-Cross-Domain-Policies': 'none',
          'X-XSS-Protection': '0',
          ...x.headers,
        },
      })),
      tapLogger('debug', `[${TAG}] OUT`)
    );
