import { pgTable, integer, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const widgets = pgTable("widgets", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "widgets_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	size: integer().notNull(),
});
