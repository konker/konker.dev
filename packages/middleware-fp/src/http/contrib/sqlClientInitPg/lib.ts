/* eslint-disable fp/no-nil */
import type { PeerCertificate } from 'node:tls';

import type { FileSystem } from '@effect/platform';
import type { SqlClient } from '@effect/sql/SqlClient';
import type { SqlError } from '@effect/sql/SqlError';
import { PgClient } from '@effect/sql-pg';
import type { Layer } from 'effect';
import { Config, ConfigError, Either, pipe, Schema } from 'effect';
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
export type CheckServerIdentityFunction = (_hostname: string, _cert: PeerCertificate) => Error | undefined;

export function ignoreCheckServerIdentity(_hostname: string, _cert: PeerCertificate): Error | undefined {
  return undefined;
}

// --------------------------------------------------------------------------
export function resolveSslConfigDirect(defaultValue: SslConfig): Config.Config<SslConfig> {
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
export function resolveSslConfigCaBundle(
  caBundle: string,
  checkServerIdentityFunction?: CheckServerIdentityFunction
): Config.Config<SslConfig> {
  return pipe(
    Config.succeed({
      ca: caBundle,
      checkServerIdentity: checkServerIdentityFunction,
    })
  );
}

// --------------------------------------------------------------------------
export function createDefaultPgSqlClientLayer(
  caBundle?: string,
  checkServerIdentityFunction?: CheckServerIdentityFunction
): Layer.Layer<SqlClient | PgClient.PgClient, SqlError | ConfigError.ConfigError, FileSystem.FileSystem> {
  const sslConfig = caBundle
    ? resolveSslConfigCaBundle(caBundle, checkServerIdentityFunction)
    : resolveSslConfigDirect(false);

  return PgClient.layerConfig({
    host: Config.string('DATABASE_HOST'),
    port: Config.number('DATABASE_PORT'),
    username: Config.string('DATABASE_USER'),
    password: Config.redacted('DATABASE_PASSWORD'),
    database: Config.string('DATABASE_NAME'),
    ssl: sslConfig,
  });
}
