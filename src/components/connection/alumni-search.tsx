"use client";

import { Search, ChevronDown } from "lucide-react";

interface AlumniSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onFilterClick: (filter: "yearOfEntry" | "company" | "expertise") => void;
}

const FILTER_CHIPS: {
  label: string;
  key: "yearOfEntry" | "company" | "expertise";
}[] = [
  { label: "Year of Entry", key: "yearOfEntry" },
  { label: "Company Name", key: "company" },
  { label: "Area of Expertise", key: "expertise" },
];

export function AlumniSearch({
  searchQuery,
  onSearchChange,
  onFilterClick,
}: AlumniSearchProps) {
  return (
    <div className="flex flex-col gap-3 px-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search alumni..."
          className="w-full h-14 bg-neutral-50 border border-brand-200 rounded-lg px-3 pr-10 font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 outline-none focus:border-brand-600 transition-colors"
        />
        <Search
          size={20}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => onFilterClick(chip.key)}
            className="flex items-center gap-1 bg-white border border-brand-800 rounded-lg px-2 py-2 cursor-pointer"
          >
            <span className="font-[family-name:var(--font-inter)] text-xs font-medium text-brand-800 whitespace-nowrap">
              {chip.label}
            </span>
            <ChevronDown size={14} className="text-brand-800 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
