/* eslint-disable fp/no-throw, fp/no-nil, fp/no-unused-expression */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// --------------------------------------------------------------------------
// Standalone migration runner, executed as a one-shot Kubernetes Job before the
// app/zero-sync roll out. Uses postgres.js directly (a prod dependency, so it
// survives `pnpm deploy --prod`) rather than drizzle-kit, which is a devDep and
// not present in the production image.
//
// MUST connect as the database superuser role: the migrations create the
// `widgets` table and the `application_boilerplate_zero_data` publication, which
// require CREATE/DDL privileges the app user does not have. Tables created by the
// superuser auto-grant DML to the app user via ALTER DEFAULT PRIVILEGES.
//
// drizzle records applied migrations in `__drizzle_migrations`, so re-running on
// every deploy is idempotent.
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString === '') {
    throw new Error('DATABASE_URL is not set');
  }

  // SQL + meta/_journal.json are shipped next to this compiled file (see tsup
  // onSuccess copy of src/database/drizzle -> dist/database/drizzle).
  const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), 'drizzle');

  const sql = postgres(connectionString, { ssl: 'require', max: 1 });
  try {
    console.log(`Running migrations from ${migrationsFolder} ...`);
    await migrate(drizzle(sql), { migrationsFolder });
    console.log('Migrations applied successfully.');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
