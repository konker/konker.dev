import type { PeerCertificate } from 'node:tls';

import { FileSystem } from '@effect/platform';
import { PgClient } from '@effect/sql-pg';
import { Config, ConfigError, Effect, Either, Layer, pipe, Schema } from 'effect';
import { type ParseError, TreeFormatter } from 'effect/ParseResult';

import { mockSqlClientLayer } from '../test/mock-sql-client';

// --------------------------------------------------------------------------
export const SslConfigSchema = Schema.parseJson(
  Schema.Union(
    Schema.Boolean,
    Schema.Struct({ caBundlePath: Schema.String }),
    Schema.Record({ key: Schema.String, value: Schema.Unknown })
  )
);
export type SslConfig = typeof SslConfigSchema.Type;

// --------------------------------------------------------------------------
export type CheckServerIdentityFunction = (_hostname: string, _cert: PeerCertificate) => Error | undefined;

export function ignoreCheckServerIdentity(_hostname: string, _cert: PeerCertificate): Error | undefined {
  // eslint-disable-next-line fp/no-nil
  return undefined;
}

// --------------------------------------------------------------------------
export const sslConfigEffect = pipe(
  // Extract the config
  Config.string('DATABASE_SSL'),
  // Parse it into an SslConfig
  Config.mapOrFail((str) =>
    pipe(
      str,
      Schema.decodeUnknownEither(SslConfigSchema),
      Either.mapLeft((err: ParseError) => ConfigError.InvalidData([], TreeFormatter.formatErrorSync(err)))
    )
  ),

  Effect.flatMap((sslConfig) =>
    // If it's an object with a caBundlePath property, read the contents and create a { ca } object;
    typeof sslConfig === 'object' && sslConfig !== null && 'caBundlePath' in sslConfig
      ? pipe(
          FileSystem.FileSystem,
          Effect.flatMap((fs) => fs.readFileString(sslConfig.caBundlePath as string, 'utf8')),
          Effect.map((ca) => ({ ca, checkServerIdentity: ignoreCheckServerIdentity }))
        )
      : // otherwise just pass it through
        Effect.succeed(sslConfig)
  )
);

// --------------------------------------------------------------------------
export const DatabaseLive = Layer.unwrapEffect(
  pipe(
    sslConfigEffect,
    Effect.map((ssl) =>
      PgClient.layerConfig({
        host: Config.string('DATABASE_HOST'),
        port: Config.number('DATABASE_PORT'),
        username: Config.string('DATABASE_USER'),
        password: Config.redacted('DATABASE_PASSWORD'),
        database: Config.string('DATABASE_NAME'),
        ssl: Config.succeed(ssl),
      })
    )
  )
);

// --------------------------------------------------------------------------
export const DatabaseTest = (responseData: Array<unknown>) => mockSqlClientLayer(responseData);
