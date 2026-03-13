"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selected: string[]) => void;
  title: string;
  options: string[];
  selected: string[];
}

export function FilterModal({
  isOpen,
  onClose,
  onApply,
  title,
  options,
  selected,
}: FilterModalProps) {
  const [draftSelected, setDraftSelected] = useState<string[] | null>(null);

  if (!isOpen) return null;

  const localSelected = draftSelected ?? selected;
  const allSelected = localSelected.length === options.length;

  function handleClose() {
    setDraftSelected(null);
    onClose();
  }

  function toggleAll() {
    if (allSelected) {
      setDraftSelected([]);
    } else {
      setDraftSelected([...options]);
    }
  }

  function toggleOption(option: string) {
    setDraftSelected((prev) => {
      const current = prev ?? selected;
      return (
        current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option]
      );
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close"
      />
      <div className="relative w-[340px] h-[248px] bg-brand-50 rounded-lg p-3 flex flex-col">
        <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-800 mb-2">
          {title}
        </h3>

        {/* All checkbox */}
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer mb-2 text-left"
          onClick={toggleAll}
        >
          <div
            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
              allSelected
                ? "bg-brand-100 border-brand-600"
                : "bg-neutral-50 border-neutral-300"
            }`}
          >
            {allSelected && <Check size={14} className="text-brand-600" />}
          </div>
          <span className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800">
            All {title}
          </span>
        </button>

        <div className="h-px bg-neutral-300 mb-2" />

        {/* Scrollable options */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {options.map((option) => {
            const isChecked = localSelected.includes(option);
            return (
              <button
                type="button"
                key={option}
                className="flex items-center gap-2 cursor-pointer text-left"
                onClick={() => toggleOption(option)}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                    isChecked
                      ? "bg-brand-100 border-brand-600"
                      : "bg-neutral-50 border-neutral-300"
                  }`}
                >
                  {isChecked && <Check size={14} className="text-brand-600" />}
                </div>
                <span
                  className={`font-[family-name:var(--font-work-sans)] text-sm ${
                    isChecked ? "text-neutral-800" : "text-neutral-500"
                  }`}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-neutral-300 my-2" />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 border border-brand-600 text-brand-600 rounded-lg py-2 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(localSelected);
              setDraftSelected(null);
            }}
            className="flex-1 bg-brand-600 text-white rounded-lg py-2 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
