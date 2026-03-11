"use client";

import { X } from "lucide-react";

interface ActivateLeaderboardSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  onToggle: (value: boolean) => void;
}

export function ActivateLeaderboardSheet({
  isOpen,
  onClose,
  isActive,
  onToggle,
}: ActivateLeaderboardSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white rounded-t-2xl z-50 p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-800">
            Activate Individual Leaderboard
          </h3>
          <button type="button" onClick={onClose} className="cursor-pointer mt-1">
            <X size={16} className="text-neutral-600" />
          </button>
        </div>

        <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 leading-5 mb-4">
          Activating the individual leaderboard means your name as a donor will
          also appear on the list.
        </p>

        <div className="flex items-center justify-between py-3 border-t border-neutral-100">
          <span className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
            Activate Individual Leaderboard
          </span>
          <button
            type="button"
            onClick={() => onToggle(!isActive)}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
              isActive ? "bg-brand-600" : "bg-neutral-300"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isActive ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </>
  );
}
