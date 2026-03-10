"use client";

import { ListFilter } from "lucide-react";

interface CategoryChipsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onSortOpen: () => void;
}

export function CategoryChips({
  categories,
  activeCategory,
  onCategoryChange,
  onSortOpen,
}: CategoryChipsProps) {
  return (
    <div className="flex items-center gap-2 px-4">
      <div className="flex flex-1 gap-1 items-center overflow-x-auto">
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
      <button
        type="button"
        onClick={onSortOpen}
        className="shrink-0 flex items-center gap-2 px-1 cursor-pointer"
      >
        <ListFilter size={16} className="text-brand-600" />
        <span className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-brand-600 leading-[18px]">
          Sort
        </span>
      </button>
    </div>
  );
}
