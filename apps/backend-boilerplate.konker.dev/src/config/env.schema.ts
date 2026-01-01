import { Schema } from 'effect';

export const EnvSchema = Schema.Struct({
  DATABASE_HOST: Schema.String,
  DATABASE_PORT: Schema.NumberFromString.pipe(Schema.int()),
  DATABASE_USERNAME: Schema.String,
  DATABASE_PASSWORD: Schema.String,
  DATABASE_DBNAME: Schema.String,
});
export type Env = typeof EnvSchema.Type;
