import type { SqlClient } from '@effect/sql/SqlClient';
import type { SqlError } from '@effect/sql/SqlError';
import * as PgDrizzle from '@effect/sql-drizzle/Pg';
import type { RequestW } from '@konker.dev/middleware-fp/http';
import { type ConfigError, Effect, pipe } from 'effect';

import * as schema from '../../database/database.schema.js';
import { API_ID, VERSION } from '../../lib/consts.js';
import type { CoreEvent, CoreResponse } from './handler.js';

export function core(
  event: RequestW<CoreEvent>
): Effect.Effect<CoreResponse, ConfigError.ConfigError | SqlError, SqlClient> {
  const t0 = performance.now();
  return pipe(
    PgDrizzle.make({ schema }),
    Effect.tap(() => Effect.logInfo('KONK0 ' + (performance.now() - t0))),
    Effect.flatMap((db) => db.select().from(schema.widgets)),
    Effect.tap(() => Effect.logInfo('KONK1 ' + (performance.now() - t0))),
    Effect.withSpan('database'),
    Effect.map((result) => ({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: {
        apiId: API_ID,
        version: VERSION,
        ip: event.headers['x-forwarded-for'] ?? 'UNKNOWN',
        konker: 'RULEZZ!!!',
        result,
      },
    })),
    Effect.withSpan('request')
  );
}
