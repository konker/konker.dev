import { SslConfigSchema } from '@konker.dev/middleware-fp/http/contrib/sqlClientInitPg';
import { Schema } from 'effect';

export const EnvSchema = Schema.Struct({
  DATABASE_HOST: Schema.String,
  DATABASE_PORT: Schema.NumberFromString.pipe(Schema.int()),
  DATABASE_USER: Schema.String,
  DATABASE_PASSWORD: Schema.String,
  DATABASE_NAME: Schema.String,
  DATABASE_SSL: SslConfigSchema,
  OTEL_TRACE_EXPORTER_URL: Schema.String,
});

export type Env = typeof EnvSchema.Type;
