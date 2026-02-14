import { Schema } from 'effect';

export const ConfigSchema = Schema.Struct({
  better_auth: Schema.Struct({
    secret: Schema.String,
    url: Schema.String,
  }),
  aws_ecr: Schema.Struct({
    registry: Schema.String,
    repository: Schema.String,
  }),
  database: Schema.Struct({
    host: Schema.String,
    port: Schema.Number.pipe(Schema.int()),
    user: Schema.String,
    password: Schema.String,
    admin_user: Schema.String,
    admin_password: Schema.String,
    name: Schema.String,
    ssl: Schema.Unknown,
  }),
  otel: Schema.Struct({
    trace_exporter_url: Schema.String,
  }),
  log: Schema.Struct({
    level: Schema.String,
  }),
});
