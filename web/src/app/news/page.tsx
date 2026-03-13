import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { articles, notifications, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSignedDownloadUrl } from "@/lib/s3";
import { toArticle } from "@/lib/articles";
import type { ApiArticle } from "@/lib/articles";
import { NewsContent } from "./news-content";

export const metadata: Metadata = {
  title: "News — IAOS Connect",
  description: "Stay up to date with the latest news, announcements, and events from the IAOS alumni network.",
};

export default async function NewsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch featured articles, list articles, and unread status in parallel
  const [featuredRows, listRows, notificationRows] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        summary: articles.summary,
        content: articles.content,
        category: articles.category,
        imageUrl: articles.imageUrl,
        isFeatured: articles.isFeatured,
        authorId: articles.authorId,
        authorName: users.name,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.isFeatured, true))
      .orderBy(desc(articles.publishedAt))
      .limit(10),
    db
      .select({
        id: articles.id,
        title: articles.title,
        summary: articles.summary,
        content: articles.content,
        category: articles.category,
        imageUrl: articles.imageUrl,
        isFeatured: articles.isFeatured,
        authorId: articles.authorId,
        authorName: users.name,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .orderBy(desc(articles.publishedAt))
      .limit(20),
    userId
      ? db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, userId))
      : Promise.resolve([]),
  ]);

  // Sign image URLs
  const [featuredWithUrls, listWithUrls] = await Promise.all([
    Promise.all(
      featuredRows.map(async (item) => ({
        ...item,
        imageUrl: item.imageUrl ? await getSignedDownloadUrl(item.imageUrl) : null,
      }))
    ),
    Promise.all(
      listRows.map(async (item) => ({
        ...item,
        imageUrl: item.imageUrl ? await getSignedDownloadUrl(item.imageUrl) : null,
      }))
    ),
  ]);

  const featuredArticles = (featuredWithUrls as unknown as ApiArticle[]).map(toArticle);
  const initialArticles = (listWithUrls as unknown as ApiArticle[]).map(toArticle);
  const hasUnread = notificationRows.some((n) => !n.isRead);

  return (
    <NewsContent
      featuredArticles={featuredArticles}
      initialArticles={initialArticles}
      hasUnread={hasUnread}
    />
  );
}
