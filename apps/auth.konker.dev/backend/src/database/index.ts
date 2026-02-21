import 'dotenv/config';

import { drizzle } from 'drizzle-orm/node-postgres';

// You can specify any property from the node-postgres connection options
export const db = drizzle({
  connection: {
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT!, 10),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
    ssl: true,
  },
});
