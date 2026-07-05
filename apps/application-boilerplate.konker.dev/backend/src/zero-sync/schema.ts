/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { createBuilder } from '@rocicorp/zero';

import type { AuthData } from './auth.js';
import { schema } from './schema.gen.js';

// --------------------------------------------------------------------------
// The Zero schema itself is generated from the Drizzle schema by drizzle-zero
// (`schema.gen.ts`, never edited by hand — run `pnpm run zero:generate`). This
// wrapper adds the hand-written concerns that codegen does not own: the shared
// query builder and the Zero default-type augmentation.
export { schema } from './schema.gen.js';
export type { Schema } from './schema.gen.js';

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
