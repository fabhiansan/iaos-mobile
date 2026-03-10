"use client";

import { useRef, useState, useEffect } from "react";
import { Badge } from "./badge";
import { Calendar } from "lucide-react";

export interface Article {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  category: "Announcement" | "Agenda" | "News";
  imageUrl: string;
}

interface FeaturedCarouselProps {
  articles: Article[];
  onReadMore: (id: string) => void;
}

export function FeaturedCarousel({ articles, onReadMore }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = 340 + 12;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(index);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto w-full px-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {articles.map((article) => (
          <div
            key={article.id}
            className="snap-start shrink-0 w-[340px] bg-white rounded-lg overflow-hidden shadow-[0px_1px_2px_0px_rgba(18,35,84,0.1)]"
          >
            <div className="relative h-[117px] bg-neutral-100 overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <Badge
                  label={article.category}
                  variant={article.category === "Announcement" ? "primary" : "secondary"}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3">
              <div className="flex flex-col gap-1">
                <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold leading-6 text-neutral-800">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-neutral-600" />
                  <span className="font-[family-name:var(--font-work-sans)] text-[10px] text-neutral-600 leading-4">
                    {article.timestamp}
                  </span>
                </div>
              </div>
              <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500 leading-[18px] line-clamp-2">
                {article.summary}
              </p>
              <div className="h-px bg-neutral-100" />
              <button
                type="button"
                onClick={() => onReadMore(article.id)}
                className="text-left font-[family-name:var(--font-work-sans)] text-sm font-medium text-brand-600 leading-5 cursor-pointer"
              >
                Read More
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 items-center">
        {articles.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 rounded-full transition-all ${
              i === activeIndex
                ? "w-4 bg-brand-600"
                : "w-2 bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
