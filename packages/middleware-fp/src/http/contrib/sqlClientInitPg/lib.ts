import type { SqlClient } from '@effect/sql/SqlClient';
import type { SqlError } from '@effect/sql/SqlError';
import { PgClient } from '@effect/sql-pg';
import { Config, ConfigError, Either, type Layer, pipe, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { TreeFormatter } from 'effect/ParseResult';

// --------------------------------------------------------------------------
export const SslConfigSchema = Schema.parseJson(
  Schema.Union(Schema.Boolean, Schema.Record({ key: Schema.String, value: Schema.Unknown }))
);
export type SslConfig = typeof SslConfigSchema.Type;

// --------------------------------------------------------------------------
/**
 * Resolves the SSL configuration for the database by reading and decoding the `DATABASE_SSL` environment variable.
 * If the variable is not set or cannot be decoded, a default value will be applied.
 *
 * @param {SslConfig} [defaultValue=false] - The default SSL configuration to use if no valid configuration is provided.
 * @return {Config.Config<SslConfig>} A configuration object for the SSL configuration, derived from the environment variable or fallback value.
 */
export function resolveSslConfig(defaultValue: SslConfig): Config.Config<SslConfig> {
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
    .pipe(Config.withDefault(defaultValue));
}

// --------------------------------------------------------------------------
/**
 * Creates a default postgresql client layer configured using environment variables.
 *
 * The configuration includes parameters such as host, port, username, password,
 * database name, and SSL settings. These values are retrieved from the environment
 * or configuration system.
 *
 * @return {Layer.Layer<SqlClient, ConfigError.ConfigError | SqlError>} A layer encapsulating the
 *         postgresql client, which can potentially fail due to configuration or SQL-related errors.
 */
export function createDefaultPgSqlClientLayer(): Layer.Layer<SqlClient, ConfigError.ConfigError | SqlError> {
  return PgClient.layerConfig({
    host: Config.string('DATABASE_HOST'),
    port: Config.number('DATABASE_PORT'),
    username: Config.string('DATABASE_USER'),
    password: Config.redacted('DATABASE_PASSWORD'),
    database: Config.string('DATABASE_NAME'),
    ssl: resolveSslConfig(false),
  });
}
