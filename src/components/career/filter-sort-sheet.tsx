"use client";

import { X } from "lucide-react";

type SortOption = "date-ascending" | "date-descending" | "a-z" | "z-a";

interface FilterSortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sort: string;
  onSortChange: (sort: string) => void;
  contractType: string;
  onContractTypeChange: (type: string) => void;
  workingType: string;
  onWorkingTypeChange: (type: string) => void;
  onReset: () => void;
  onApply: () => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "date-ascending", label: "Date Created - Ascending" },
  { value: "date-descending", label: "Date Created - Descending" },
  { value: "a-z", label: "Alphabetical - (A-Z)" },
  { value: "z-a", label: "Alphabetical - (Z-A)" },
];

const contractTypes = [
  "All Contract",
  "Full-time",
  "Contract",
  "Project Based",
  "Part-time",
  "Internship",
];

const workingTypes = ["All Type", "On-site", "Hybrid", "Remote"];

export function FilterSortSheet({
  isOpen,
  onClose,
  sort,
  onSortChange,
  contractType,
  onContractTypeChange,
  workingType,
  onWorkingTypeChange,
  onReset,
  onApply,
}: FilterSortSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[390px] bg-white rounded-t-2xl p-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-800">
            Filter and Sort
          </h3>
          <button type="button" onClick={onClose} className="cursor-pointer">
            <X size={16} className="text-neutral-600" />
          </button>
        </div>

        {/* Sort Section */}
        <div className="mb-6">
          <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800 mb-3">
            Sort
          </p>
          <div className="flex flex-col gap-3">
            {sortOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    sort === opt.value
                      ? "border-brand-600"
                      : "border-neutral-300"
                  }`}
                >
                  {sort === opt.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                  )}
                </div>
                <span className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Contract Type Section */}
        <div className="mb-6">
          <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800 mb-3">
            Contract Type
          </p>
          <div className="flex flex-wrap gap-2">
            {contractTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onContractTypeChange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium font-[family-name:var(--font-work-sans)] border cursor-pointer transition-colors ${
                  contractType === type
                    ? "bg-brand-800 text-white border-brand-800"
                    : "bg-white text-brand-800 border-brand-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Working Type Section */}
        <div className="mb-6">
          <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800 mb-3">
            Working Type
          </p>
          <div className="flex flex-wrap gap-2">
            {workingTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onWorkingTypeChange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium font-[family-name:var(--font-work-sans)] border cursor-pointer transition-colors ${
                  workingType === type
                    ? "bg-brand-800 text-white border-brand-800"
                    : "bg-white text-brand-800 border-brand-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 border border-neutral-800 text-neutral-800 rounded-lg py-3 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 bg-brand-600 text-white rounded-lg py-3 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
