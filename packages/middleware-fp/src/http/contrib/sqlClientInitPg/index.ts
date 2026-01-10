import type { SqlClient } from '@effect/sql/SqlClient';
import type { SqlError } from '@effect/sql/SqlError';
import type { ConfigError, Layer } from 'effect';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../../index.js';
import type { RequestW } from '../../RequestW.js';
import { createDefaultPgSqlClientLayer } from './lib.js';

const TAG = 'sqlClientInitPg';

export type Adapted<R> = Exclude<R, SqlClient>;

export const middleware =
  (pgSqlClientLayer?: Layer.Layer<SqlClient, ConfigError.ConfigError | SqlError>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R | SqlClient>
  ): RequestResponseHandler<I, O, E | ConfigError.ConfigError | SqlError, Adapted<R>> =>
  (i: RequestW<I>) => {
    const layer = pgSqlClientLayer ?? createDefaultPgSqlClientLayer();

    return pipe(wrapped(i), Effect.provide(layer), Effect.tap(Effect.logDebug(`[${TAG}] OUT`)));
  };
