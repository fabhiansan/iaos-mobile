"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SortOption = "date-ascending" | "date-descending" | "a-z" | "importance-high";

interface SortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "date-ascending", label: "Date Created - Ascending" },
  { value: "date-descending", label: "Date Created - Descending" },
  { value: "a-z", label: "Alphabetical - A-Z" },
  { value: "importance-high", label: "Importance - L-H" },
];

export function SortSheet({ isOpen, onClose, activeSort, onSortChange }: SortSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[390px] bg-white rounded-t-2xl p-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-800">
            Sorting News
          </h3>
          <button type="button" onClick={onClose} className="cursor-pointer">
            <X size={16} className="text-neutral-600" />
          </button>
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {sortOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  activeSort === opt.value
                    ? "border-brand-600"
                    : "border-neutral-300"
                }`}
              >
                {activeSort === opt.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                )}
              </div>
              <span className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
        <Button variant="primary" onClick={onClose}>
          Apply
        </Button>
      </div>
    </div>
  );
}
