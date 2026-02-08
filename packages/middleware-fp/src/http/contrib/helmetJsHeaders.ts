import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../index.js';
import type { RequestW } from '../RequestW.js';

// Based on : https://helmetjs.github.io/
const TAG = 'helmetJsHeaders';

export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E, R> =>
  (i: RequestW<I>) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(wrapped),
      Effect.map((x) => ({
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
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.withSpan(TAG)
    );
