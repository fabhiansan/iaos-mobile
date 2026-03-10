"use client";

import { Search } from "lucide-react";

interface DonationChipsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onSearchOpen: () => void;
}

export function DonationChips({
  categories,
  activeCategory,
  onCategoryChange,
  onSearchOpen,
}: DonationChipsProps) {
  return (
    <div className="flex items-center gap-1 px-4 overflow-x-auto">
      <button
        type="button"
        onClick={onSearchOpen}
        className="shrink-0 flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium leading-[18px] border border-neutral-600 text-neutral-800 font-[family-name:var(--font-inter)] cursor-pointer"
      >
        <Search size={14} className="text-neutral-800" />
        Search
      </button>
      {categories.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`shrink-0 px-2 py-2 rounded-lg text-xs font-medium leading-[18px] border cursor-pointer transition-colors ${
              isActive
                ? "bg-brand-800 border-brand-500 text-brand-50 font-[family-name:var(--font-work-sans)]"
                : "bg-transparent border-neutral-600 text-neutral-800 font-[family-name:var(--font-inter)]"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
