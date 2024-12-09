/* eslint-disable @typescript-eslint/naming-convention */
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';
import type { OptionalResponseHeaders } from '../lib/http';

// Based on : https://helmetjs.github.io/
const TAG = 'helmetJsHeaders';

export type WithOutputHeaders = {
  readonly headers?: OptionalResponseHeaders;
};

export const middleware =
  () =>
  <I, O, E, R>(wrapped: Handler<I, O & WithOutputHeaders, E, R>): Handler<I, O, E, R> =>
  (i: I) =>
    pipe(
      // Lift the input
      Effect.succeed(i),
      // Log before
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      // Call the next middleware in the stack
      Effect.flatMap(wrapped),
      // Do something with the output
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
      // Log after
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
