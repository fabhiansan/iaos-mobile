import { pgTable, uuid, varchar, text, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    uniqueIndex("provider_provider_account_id_idx").on(
      table.provider,
      table.providerAccountId
    ),
  ]
);
