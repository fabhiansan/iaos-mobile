"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, ListFilter } from "lucide-react";
import { FeaturedCarousel } from "@/components/news/featured-carousel";
import { ArticleCard } from "@/components/news/article-card";
import { SortSheet } from "@/components/news/sort-sheet";
import {
  MobilePageLayout,
  MobilePageHeader,
  MobileHeaderAction,
  MobileFilterChips,
} from "@/components/ui/mobile-page-layout";
import { toArticle } from "@/lib/articles";
import type { ApiArticle } from "@/lib/articles";
import type { Article } from "@/components/news/featured-carousel";

const CATEGORIES = ["All News", "Announcement", "Agenda"];

export default function NewsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All News");
  const [sortOpen, setSortOpen] = useState(false);
  const [activeSort, setActiveSort] = useState<"date-ascending" | "date-descending" | "a-z" | "importance-high">("date-descending");

  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [listArticles, setListArticles] = useState<Article[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Fetch featured articles once on mount (independent of category)
  useEffect(() => {
    fetch("/api/news?featured=true&limit=10")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setFeaturedArticles((json.data as ApiArticle[]).map(toArticle));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch list articles when category changes
  const fetchListArticles = useCallback(async () => {
    try {
      const categoryParam =
        activeCategory !== "All News" ? `&category=${activeCategory}` : "";
      const res = await fetch(`/api/news?limit=20${categoryParam}`);
      if (res.ok) {
        const { data } = await res.json();
        setListArticles((data as ApiArticle[]).map(toArticle));
      }
    } catch {
      // silently fail
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchListArticles();
  }, [fetchListArticles]);

  // Check for unread notifications once on mount
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setHasUnread(json.data.some((n: { isRead: boolean }) => !n.isRead));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <MobilePageLayout activeItem="news">
      {({ onMenuOpen }) => (
        <>
          <MobilePageHeader
            title="Tidal News"
            onMenuOpen={onMenuOpen}
            rightActions={
              <>
                <MobileHeaderAction
                  icon={Search}
                  onClick={() => router.push("/news/search")}
                />
                <MobileHeaderAction
                  icon={Bell}
                  onClick={() => router.push("/news/notifications")}
                  badge={hasUnread}
                />
              </>
            }
          />

          <div className="flex flex-col gap-6 pt-2 pb-24">
            <FeaturedCarousel
              articles={featuredArticles}
              onReadMore={(id) => router.push(`/news/${id}`)}
            />

            <MobileFilterChips
              options={CATEGORIES}
              value={activeCategory}
              onChange={setActiveCategory}
              leading={
                <button
                  type="button"
                  onClick={() => setSortOpen(true)}
                  className="shrink-0 flex items-center gap-2 px-1 cursor-pointer"
                >
                  <ListFilter size={16} className="text-brand-600" />
                  <span className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-brand-600 leading-[18px]">
                    Sort
                  </span>
                </button>
              }
            />

            <div className="flex flex-col gap-3 px-4">
              {listArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={(id) => router.push(`/news/${id}`)}
                />
              ))}
            </div>
          </div>

          <SortSheet
            isOpen={sortOpen}
            onClose={() => setSortOpen(false)}
            activeSort={activeSort}
            onSortChange={setActiveSort}
          />
        </>
      )}
    </MobilePageLayout>
  );
}
