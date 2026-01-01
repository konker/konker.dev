import { Schema } from 'effect';

export const ConfigSchema = Schema.Struct({
  database: Schema.Struct({
    host: Schema.String,
    port: Schema.Number.pipe(Schema.int()),
    username: Schema.String,
    password: Schema.String,
    dbname: Schema.String,
  }),
});
