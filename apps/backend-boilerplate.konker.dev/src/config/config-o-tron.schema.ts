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
});
