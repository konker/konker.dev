import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';

export const widgetsTable = pgTable('widgets', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  size: integer().notNull(),
});
