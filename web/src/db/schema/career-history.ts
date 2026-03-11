import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const careerHistory = pgTable("career_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  position: varchar("position", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year"),
  isCurrent: boolean("is_current").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
