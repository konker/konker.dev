import * as Schema from 'effect/Schema';

export const ConfigSchema = Schema.Struct({
  database: Schema.Struct({
    host: Schema.String,
    port: Schema.Number.pipe(Schema.int(), Schema.between(1, 65535)),
    url: Schema.String,
  }),
  api: Schema.Struct({
    timeout: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1)),
  }),
  feature: Schema.Struct({
    enableBeta: Schema.Boolean,
  }),
  tags: Schema.Array(Schema.String),
});
