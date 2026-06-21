import type { RequestW } from '@konker.dev/middleware-fp/http';
import { type ConfigError, Effect, pipe } from 'effect';

import { API_ID, VERSION } from '../../lib/consts.js';
import type { CoreEvent, CoreResponse } from './handler.js';

export function core(event: RequestW<CoreEvent>): Effect.Effect<CoreResponse, ConfigError.ConfigError, never> {
  return pipe(
    Effect.succeed('FOO'),
    Effect.tap(() => Effect.logInfo('foo')),
    Effect.map((result) => ({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: {
        apiId: API_ID,
        version: VERSION,
        ip: event.headers['x-forwarded-for'] ?? 'UNKNOWN',
        konker: 'RULEZZ!',
        result,
      },
    }))
  );
}
