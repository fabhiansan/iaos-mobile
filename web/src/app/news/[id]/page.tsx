"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Calendar } from "lucide-react";
import { Badge } from "@/components/news/badge";
import { formatTimestamp } from "@/lib/articles";

interface ArticleDetail {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "Announcement" | "Agenda" | "News";
  imageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
}

export default function NewsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/news/${params.id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Article not found" : "Failed to load article");
          return;
        }
        const { data } = await res.json();
        setArticle(data);
      } catch {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [params.id]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500">
          Loading...
        </p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
        <div className="flex items-center gap-4 px-4 py-2 h-11">
          <button type="button" onClick={() => router.back()} className="shrink-0 cursor-pointer">
            <ChevronLeft size={16} className="text-neutral-900" />
          </button>
          <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
            Tidal News
          </h1>
        </div>
        <div className="flex items-center justify-center pt-20">
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500">
            {error || "Article not found"}
          </p>
        </div>
      </div>
    );
  }

  const timestamp = formatTimestamp(article.publishedAt);

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 h-11">
        <button type="button" onClick={() => router.back()} className="shrink-0 cursor-pointer">
          <ChevronLeft size={16} className="text-neutral-900" />
        </button>
        <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
          Tidal News
        </h1>
      </div>

      {/* Featured Image */}
      <div className="relative w-full h-[240px] bg-neutral-100 overflow-hidden">
        <img
          src={article.imageUrl || "/images/news-placeholder-1.jpg"}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-4">
          <Badge
            label={article.category}
            variant={article.category === "Announcement" ? "primary" : "secondary"}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-800 leading-7">
            {article.title}
          </h2>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-neutral-600" />
            <span className="font-[family-name:var(--font-work-sans)] text-[10px] text-neutral-600 leading-4">
              {timestamp}
            </span>
          </div>
        </div>

        <div className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-600 leading-6 whitespace-pre-line">
          {article.content}
        </div>
      </div>
    </div>
  );
}
