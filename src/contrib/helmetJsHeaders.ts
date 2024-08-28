/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import type { OptionalResponseHeaders } from '../lib/http';

// Based on : https://helmetjs.github.io/
const TAG = 'helmetJsHeaders';

export type WithOutputHeaders = {
  readonly headers?: OptionalResponseHeaders;
};

export const middleware =
  () =>
  <WI, WO, WE, WR>(wrapped: Handler<WI, WO & WithOutputHeaders, WE, WR>): Handler<WI, WO, WE, WR> =>
  (i: WI) =>
    P.pipe(
      // Lift the input
      P.Effect.succeed(i),
      // Log before
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      // Call the next middleware in the stack
      P.Effect.flatMap(wrapped),
      // Do something with the output
      P.Effect.map((x) => ({
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
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
