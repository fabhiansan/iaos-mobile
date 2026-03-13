"use client";

import { useState, useEffect, useReducer } from "react";
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

type SortOption = "date-ascending" | "date-descending" | "a-z" | "importance-high";

interface NewsState {
  activeCategory: string;
  sortOpen: boolean;
  activeSort: SortOption;
  listArticles: Article[];
}

type NewsAction =
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "SET_SORT_OPEN"; payload: boolean }
  | { type: "SET_SORT"; payload: SortOption }
  | { type: "SET_LIST_ARTICLES"; payload: Article[] };

function newsReducer(state: NewsState, action: NewsAction): NewsState {
  switch (action.type) {
    case "SET_CATEGORY":
      return { ...state, activeCategory: action.payload };
    case "SET_SORT_OPEN":
      return { ...state, sortOpen: action.payload };
    case "SET_SORT":
      return { ...state, activeSort: action.payload };
    case "SET_LIST_ARTICLES":
      return { ...state, listArticles: action.payload };
  }
}

interface NewsContentProps {
  featuredArticles: Article[];
  initialArticles: Article[];
  hasUnread: boolean;
}

export function NewsContent({
  featuredArticles,
  initialArticles,
  hasUnread,
}: NewsContentProps) {
  const router = useRouter();

  const [state, dispatch] = useReducer(newsReducer, {
    activeCategory: "All News",
    sortOpen: false,
    activeSort: "date-descending",
    listArticles: initialArticles,
  });

  // Re-fetch list articles when category changes (skip initial "All News" since we have server data)
  useEffect(() => {
    if (state.activeCategory === "All News") {
      dispatch({ type: "SET_LIST_ARTICLES", payload: initialArticles });
      return;
    }

    let cancelled = false;

    fetch(`/api/news?limit=20&category=${state.activeCategory}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.data) {
          dispatch({
            type: "SET_LIST_ARTICLES",
            payload: (json.data as ApiArticle[]).map(toArticle),
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [state.activeCategory, initialArticles]);

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
              value={state.activeCategory}
              onChange={(v) => dispatch({ type: "SET_CATEGORY", payload: v })}
              leading={
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_SORT_OPEN", payload: true })}
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
              {state.listArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={(id) => router.push(`/news/${id}`)}
                />
              ))}
            </div>
          </div>

          <SortSheet
            isOpen={state.sortOpen}
            onClose={() => dispatch({ type: "SET_SORT_OPEN", payload: false })}
            activeSort={state.activeSort}
            onSortChange={(v) => dispatch({ type: "SET_SORT", payload: v })}
          />
        </>
      )}
    </MobilePageLayout>
  );
}
