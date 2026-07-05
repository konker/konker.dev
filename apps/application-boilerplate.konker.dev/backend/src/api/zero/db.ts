/* eslint-disable fp/no-throw, fp/no-let, fp/no-mutation, fp/no-nil, @typescript-eslint/consistent-type-definitions */
import { zeroPostgresJS } from '@rocicorp/zero/server/adapters/postgresjs';

import { schema } from '../../zero-sync/schema.js';

// --------------------------------------------------------------------------
// Zero's server-side query/mutate endpoints talk to the upstream Postgres
// directly via postgres.js (separate from the Effect PgClient used elsewhere).
// Pass the connection string (not a Sql instance) so the adapter builds the
// client with its own pinned postgres.js, avoiding cross-version type clashes.
// Lazily initialised so the server can start without ZERO_UPSTREAM_DB set
// (only the /zero/* routes require it).
function makeDbProvider() {
  const connectionString = process.env.ZERO_UPSTREAM_DB;
  if (connectionString === undefined || connectionString === '') {
    throw new Error('ZERO_UPSTREAM_DB is not set');
  }
  return zeroPostgresJS(schema, connectionString);
}

export type DbProvider = ReturnType<typeof makeDbProvider>;

let dbProvider: DbProvider | undefined;

export function getDbProvider(): DbProvider {
  dbProvider ??= makeDbProvider();
  return dbProvider;
}

// --------------------------------------------------------------------------
// Register the postgres.js db provider as Zero's default so that custom mutator
// transactions are typed as server transactions wrapping a postgres.js tx.
declare module '@rocicorp/zero' {
  interface DefaultTypes {
    dbProvider: DbProvider;
  }
}
