import { pgEnum, pgTable, uuid, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { articles } from "./articles";

export const notificationTypeEnum = pgEnum("notification_type", [
  "article",
  "donation",
  "job",
  "announcement",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message"),
  type: notificationTypeEnum("type").notNull(),
  resourceId: uuid("resource_id"),
  link: text("link"),
  articleId: uuid("article_id").references(() => articles.id),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
