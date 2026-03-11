import { pgTable, pgEnum, uuid, varchar, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const articleCategoryEnum = pgEnum("article_category", ["Announcement", "Agenda", "News"]);

export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  category: articleCategoryEnum("category").notNull(),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").default(false),
  authorId: uuid("author_id").notNull().references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
