import { drizzleZeroConfig } from 'drizzle-zero';

import * as drizzleSchema from '../database/database.schema.js';

// --------------------------------------------------------------------------
// drizzle-zero reads this config to generate `src/zero-sync/schema.gen.ts`
// (run `pnpm run zero:generate`). Every table/column Zero should sync must be
// listed explicitly (opt-in) — this mirrors the "expand/migrate/contract"
// pattern from the Zero docs and keeps the synced surface intentional.
export default drizzleZeroConfig(drizzleSchema, {
  tables: {
    widgets: {
      id: true,
      name: true,
      size: true,
    },
  },
});
