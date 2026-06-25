import { integer, pgTable, text } from 'drizzle-orm/pg-core';

// `id` is a client-generated string PK so Zero custom mutators can create rows
// optimistically on the client. Mirrors the zerosync Zero schema
// (`zerosync/src/schema.ts`): { id: string, name: string, size: number }.
export const widgets = pgTable('widgets', {
  id: text().primaryKey(),
  name: text().notNull(),
  size: integer().notNull(),
});
