import type { FileSystem } from '@effect/platform';
import type { SqlClient } from '@effect/sql/SqlClient';
import type { SqlError } from '@effect/sql/SqlError';
import { type ConfigError, type Layer, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../../index.js';
import type { RequestW } from '../../RequestW.js';
import { createDefaultPgSqlClientLayer } from './lib.js';

const TAG = 'sqlClientInitPg';

export type Adapted<R> = Exclude<R, SqlClient> | FileSystem.FileSystem;

export { SslConfigSchema, type SslConfig } from './lib.js';

export const middleware =
  (caBundleFilePath?: string, pgSqlClientLayer?: Layer.Layer<SqlClient, ConfigError.ConfigError | SqlError>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R | SqlClient>
  ): RequestResponseHandler<I, O, E | ConfigError.ConfigError | SqlError, Adapted<R>> =>
  (i: RequestW<I>) => {
    if (pgSqlClientLayer) {
      return pipe(wrapped(i), Effect.provide(pgSqlClientLayer), Effect.tap(Effect.logDebug(`[${TAG}] OUT`)));
    }

    return pipe(
      wrapped(i),
      Effect.provide(createDefaultPgSqlClientLayer(caBundleFilePath)),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
