import { Schema } from 'effect';

import { SslConfigSchema } from '../deps/database.js';

export const EnvSchema = Schema.Struct({
  DATABASE_HOST: Schema.String,
  DATABASE_PORT: Schema.NumberFromString.pipe(Schema.int()),
  DATABASE_USER: Schema.String,
  DATABASE_PASSWORD: Schema.String,
  DATABASE_NAME: Schema.String,
  DATABASE_SSL: SslConfigSchema,
  OTEL_TRACE_EXPORTER_URL: Schema.String,
  LOG_LEVEL: Schema.String,
  // Zero Sync + JWT auth — required by the /zero/* routes, optional here so the
  // shared env validation does not couple the other routes/targets to them.
  ZERO_UPSTREAM_DB: Schema.optional(Schema.String),
  ZERO_BACKEND_SERVICE_TOKEN: Schema.optional(Schema.String),
  JWT_SIGNING_SECRET: Schema.optional(Schema.String),
  JWT_ISSUER: Schema.optional(Schema.String),
});

export type Env = typeof EnvSchema.Type;
