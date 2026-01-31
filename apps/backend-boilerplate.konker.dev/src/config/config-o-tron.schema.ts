import { Schema } from 'effect';

export const ConfigSchema = Schema.Struct({
  aws_ecr: Schema.Struct({
    registry: Schema.String,
    repository: Schema.String,
  }),
  database: Schema.Struct({
    host: Schema.String,
    port: Schema.Number.pipe(Schema.int()),
    user: Schema.String,
    password: Schema.String,
    name: Schema.String,
    ssl: Schema.Unknown,
  }),
  otel: Schema.Struct({
    trace_sink_url: Schema.String,
    trace_sink_basic_auth_username: Schema.String,
    trace_sink_basic_auth_password: Schema.String,
  }),
});
