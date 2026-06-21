/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { createBuilder, createSchema, number, string, table } from '@rocicorp/zero';

import type { AuthData } from './auth.js';

// --------------------------------------------------------------------------
// One entity for the vertical slice. `id` is a client-generated string PK so
// that Zero custom mutators can create rows optimistically on the client.
export const widgets = table('widgets')
  .columns({
    id: string(),
    name: string(),
    size: number(),
  })
  .primaryKey('id');

// --------------------------------------------------------------------------
export const schema = createSchema({
  tables: [widgets],
});

export type Schema = typeof schema;

// Query builder shared by queries.ts (server) and the frontend.
export const builder = createBuilder(schema);

// --------------------------------------------------------------------------
// Register the app schema + auth context as Zero's defaults so that
// `defineQuery`/`defineMutator` infer them without explicit generics.
declare module '@rocicorp/zero' {
  interface DefaultTypes {
    schema: typeof schema;
    context: AuthData | undefined;
  }
}
