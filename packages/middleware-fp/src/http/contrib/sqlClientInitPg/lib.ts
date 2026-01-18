import { FileSystem } from '@effect/platform';
import type { PlatformError } from '@effect/platform/Error';
import type { SqlClient } from '@effect/sql/SqlClient';
import type { SqlError } from '@effect/sql/SqlError';
import { PgClient } from '@effect/sql-pg';
import { Config, ConfigError, Effect, Either, Layer, pipe, Schema } from 'effect';
import { type ParseError, TreeFormatter } from 'effect/ParseResult';

// --------------------------------------------------------------------------
export const SslConfigSchema = Schema.parseJson(
  Schema.Union(
    Schema.Boolean,
    Schema.Struct({ ca: Schema.String }),
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  )
);
export type SslConfig = typeof SslConfigSchema.Type;

// --------------------------------------------------------------------------
export function resolveSslConfigDirect(
  defaultValue: SslConfig
): Effect.Effect<Config.Config<SslConfig>, ConfigError.ConfigError> {
  return Config.string('DATABASE_SSL')
    .pipe(
      Config.mapOrFail((str) =>
        pipe(
          str,
          Schema.decodeUnknownEither(SslConfigSchema),
          Either.mapLeft((err: ParseError) =>
            ConfigError.InvalidData([], `[${str}]` + TreeFormatter.formatErrorSync(err))
          )
        )
      )
    )
    .pipe(Config.withDefault(defaultValue))
    .pipe(Effect.succeed);
}

// --------------------------------------------------------------------------
export function resolveSslConfigCaBundle(
  caBundleFilePath: string
): Effect.Effect<Config.Config<SslConfig>, ConfigError.ConfigError, FileSystem.FileSystem> {
  return pipe(
    FileSystem.FileSystem,
    Effect.flatMap((fs) => fs.readFileString(caBundleFilePath, 'utf8')),
    Effect.mapError((err: PlatformError) => ConfigError.InvalidData([], err.message)),
    Effect.map((ca) => Config.succeed({ ca }))
  );
}

// --------------------------------------------------------------------------
export function createDefaultPgSqlClientLayer(
  caBundleFilePath?: string
): Layer.Layer<SqlClient | PgClient.PgClient, SqlError | ConfigError.ConfigError, FileSystem.FileSystem> {
  const sslConfigEffect = caBundleFilePath ? resolveSslConfigCaBundle(caBundleFilePath) : resolveSslConfigDirect(false);

  return Layer.unwrapEffect(
    Effect.map(sslConfigEffect, (sslConfig) =>
      PgClient.layerConfig({
        host: Config.string('DATABASE_HOST'),
        port: Config.number('DATABASE_PORT'),
        username: Config.string('DATABASE_USER'),
        password: Config.redacted('DATABASE_PASSWORD'),
        database: Config.string('DATABASE_NAME'),
        ssl: sslConfig,
      })
    )
  );
}
