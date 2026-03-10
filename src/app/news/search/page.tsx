"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, X } from "lucide-react";
import { ArticleCard } from "@/components/news/article-card";
import type { Article } from "@/components/news/featured-carousel";

const ALL_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Hasil Rapat Tahunan Ikatan Alumni 2025",
    summary:
      "Rangkuman keputusan strategis mengenai beasiswa baru, restrukturisasi organisasi, dan rangkaian agenda kegiatan ikatan alumni",
    timestamp: "20 January 2025 - 09:00",
    category: "Announcement",
    imageUrl: "/images/news-placeholder-1.jpg",
  },
  {
    id: "5",
    title: "Seminar Oseanografi: Tantangan Iklim Global",
    summary:
      "Mengundang alumni sebagai narasumber tamu untuk berbagi…",
    timestamp: "20 January 2025 - 09:00",
    category: "Agenda",
    imageUrl: "/images/news-placeholder-5.jpg",
  },
  {
    id: "6",
    title: "Rapat Koordinasi Alumni Oseanografi ITB",
    summary:
      "Agenda rapat alumni yang membahas program kerja, penguatan jaringan alumni.",
    timestamp: "20 January 2025 - 09:00",
    category: "Announcement",
    imageUrl: "/images/news-placeholder-6.jpg",
  },
];

export default function SearchNewsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const results = hasSearched
    ? ALL_ARTICLES.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.summary.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSearch = () => {
    if (query.trim()) setHasSearched(true);
  };

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
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setHasSearched(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search News"
            className="flex-1 bg-transparent font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
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
        {hasSearched && results.length > 0 && (
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

        {hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 gap-2">
            <Search size={40} className="text-neutral-300" />
            <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
              No Search Result yet
            </p>
          </div>
        )}

        {!hasSearched && !query && (
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
