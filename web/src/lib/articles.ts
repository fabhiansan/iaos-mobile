import type { Article } from "@/components/news/featured-carousel";

export interface ApiArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "Announcement" | "Agenda" | "News";
  imageUrl: string | null;
  isFeatured: boolean | null;
  authorId: string;
  authorName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function formatTimestamp(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toArticle(a: ApiArticle): Article {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    timestamp: formatTimestamp(a.publishedAt),
    category: a.category,
    imageUrl: a.imageUrl || "/images/news-placeholder-1.jpg",
  };
}
