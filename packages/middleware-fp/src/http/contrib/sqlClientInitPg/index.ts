import type { FileSystem } from '@effect/platform';
import type { SqlClient } from '@effect/sql/SqlClient';
import type { SqlError } from '@effect/sql/SqlError';
import { type ConfigError, type Layer, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../../index.js';
import type { RequestW } from '../../RequestW.js';
import type { WithValidatedEnv } from '../envValidator.js';
import { type CheckServerIdentityFunction, createDefaultPgSqlClientLayer } from './lib.js';

const TAG = 'sqlClientInitPg';

export type SqlClientPgInitParams = {
  readonly DATABASE_HOST: string;
  readonly DATABASE_PORT: number;
  readonly DATABASE_USER: string;
  readonly DATABASE_PASSWORD: string;
  readonly DATABASE_NAME: string;
};

export type Adapted<R> = Exclude<R, SqlClient> | FileSystem.FileSystem;

export { type CheckServerIdentityFunction, ignoreCheckServerIdentity, SslConfigSchema, type SslConfig } from './lib.js';

export const middleware =
  (
    caBundleFilePath?: string,
    checkServerIdentityFunction?: CheckServerIdentityFunction,
    pgSqlClientLayer?: Layer.Layer<SqlClient, ConfigError.ConfigError | SqlError>
  ) =>
  <I extends WithValidatedEnv<SqlClientPgInitParams>, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R | SqlClient>
  ): RequestResponseHandler<I, O, E | ConfigError.ConfigError | SqlError, Adapted<R>> =>
  (i: RequestW<I>) => {
    if (pgSqlClientLayer) {
      return pipe(
        Effect.succeed(i),
        Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
        Effect.flatMap(wrapped),
        Effect.tap(Effect.logDebug(`KONK80`)),
        Effect.provide(pgSqlClientLayer),
        Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
      );
    }

    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(wrapped),
      Effect.provide(createDefaultPgSqlClientLayer(caBundleFilePath, checkServerIdentityFunction)),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
