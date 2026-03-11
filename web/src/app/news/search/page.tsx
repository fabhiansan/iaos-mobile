"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, X } from "lucide-react";
import { ArticleCard } from "@/components/news/article-card";
import { toArticle } from "@/lib/articles";
import type { ApiArticle } from "@/lib/articles";
import type { Article } from "@/components/news/featured-carousel";

export default function SearchNewsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/news?search=${encodeURIComponent(searchQuery)}&limit=20`
      );
      if (res.ok) {
        const { data } = await res.json();
        setResults((data as ApiArticle[]).map(toArticle));
      }
      setHasSearched(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 h-11">
        <button type="button" onClick={() => router.back()} className="shrink-0 cursor-pointer">
          <ChevronLeft size={16} className="text-neutral-900" />
        </button>
        <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
          Search News
        </h1>
      </div>

      {/* Search Input */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 border border-neutral-300 rounded-lg px-3 py-2.5">
          <Search size={16} className="text-neutral-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search News"
            className="flex-1 bg-transparent font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
              }}
              className="cursor-pointer"
            >
              <X size={16} className="text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pt-4">
        {loading && (
          <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
            Searching...
          </p>
        )}

        {!loading && hasSearched && results.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
              {results.length} Search Results found
            </p>
            {results.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={(id) => router.push(`/news/${id}`)}
              />
            ))}
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 gap-2">
            <Search size={40} className="text-neutral-300" />
            <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
              No Search Result yet
            </p>
          </div>
        )}

        {!loading && !hasSearched && !query && (
          <div className="flex flex-col items-center justify-center pt-20 gap-2">
            <Search size={40} className="text-neutral-300" />
            <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
              No Search Result yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
