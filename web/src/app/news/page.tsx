"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { NewsHeader } from "@/components/news/news-header";
import { FeaturedCarousel } from "@/components/news/featured-carousel";
import { ArticleCard } from "@/components/news/article-card";
import { CategoryChips } from "@/components/news/category-chips";
import { SortSheet } from "@/components/news/sort-sheet";
import { SideDrawer } from "@/components/news/side-drawer";
import { LogoutModal } from "@/components/news/logout-modal";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { toArticle } from "@/lib/articles";
import type { ApiArticle } from "@/lib/articles";
import type { Article } from "@/components/news/featured-carousel";

const CATEGORIES = ["All News", "Announcement", "Agenda"];

export default function NewsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All News");
  const [sortOpen, setSortOpen] = useState(false);
  const [activeSort, setActiveSort] = useState<"date-ascending" | "date-descending" | "a-z" | "importance-high">("date-descending");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

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
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative overflow-hidden">
      {/* Gradient blob */}
      <div
        className="absolute -top-[142px] left-1/2 -translate-x-1/2 w-[493px] h-[474px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(101,119,159,0.4) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative z-10">
        <NewsHeader
          onMenuOpen={() => setDrawerOpen(true)}
          onSearchOpen={() => router.push("/news/search")}
          onNotificationsOpen={() => router.push("/news/notifications")}
          hasUnread={hasUnread}
        />

        <div className="flex flex-col gap-6 pt-2 pb-24">
          <FeaturedCarousel
            articles={featuredArticles}
            onReadMore={(id) => router.push(`/news/${id}`)}
          />

          <CategoryChips
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onSortOpen={() => setSortOpen(true)}
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
      </div>

      <SortSheet
        isOpen={sortOpen}
        onClose={() => setSortOpen(false)}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="news"
        onNavigate={(item) => {
          setDrawerOpen(false);
          if (item !== "news") router.push(`/${item}`);
        }}
        onLogout={() => {
          setDrawerOpen(false);
          setLogoutOpen(true);
        }}
      />

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await signOut({ callbackUrl: "/login" });
        }}
      />

      <BottomTabBar />
    </div>
  );
}
