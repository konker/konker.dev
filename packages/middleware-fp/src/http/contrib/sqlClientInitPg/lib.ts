import type { SqlClient } from '@effect/sql/SqlClient';
import type { SqlError } from '@effect/sql/SqlError';
import { PgClient } from '@effect/sql-pg';
import type { ConfigError, Layer } from 'effect';
import { Config } from 'effect';

// --------------------------------------------------------------------------
// Create the default Pg SqlClient layer from environment config
export function createDefaultPgSqlClientLayer(): Layer.Layer<SqlClient, ConfigError.ConfigError | SqlError> {
  return PgClient.layerConfig({
    host: Config.string('DATABASE_HOST'),
    port: Config.number('DATABASE_PORT'),
    username: Config.string('DATABASE_USER'),
    password: Config.redacted('DATABASE_PASSWORD'),
    database: Config.string('DATABASE_NAME'),
    ssl: Config.succeed(true),
  });
}
