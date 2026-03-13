import { pgTable, pgEnum, uuid, varchar, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  nim: varchar("nim", { length: 20 }).unique(),
  yearOfEntry: integer("year_of_entry"),
  phone: varchar("phone", { length: 20 }),
  role: roleEnum("role").default("user").notNull(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  profileImageUrl: text("profile_image_url"),
  profileComplete: boolean("profile_complete").default(false).notNull(),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
