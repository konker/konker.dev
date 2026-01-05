import { Schema } from 'effect';

export const ConfigSchema = Schema.Struct({
  database: Schema.Struct({
    url: Schema.String,
  }),
});
