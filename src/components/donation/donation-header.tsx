"use client";

import { Menu, BarChart3 } from "lucide-react";

interface DonationHeaderProps {
  onMenuOpen: () => void;
  onLeaderboardOpen: () => void;
}

export function DonationHeader({
  onMenuOpen,
  onLeaderboardOpen,
}: DonationHeaderProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 h-11">
      <button type="button" onClick={onMenuOpen} className="shrink-0 cursor-pointer">
        <Menu size={16} className="text-neutral-900" />
      </button>
      <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
        Jalap Care Donation
      </h1>
      <button type="button" onClick={onLeaderboardOpen} className="shrink-0 cursor-pointer">
        <BarChart3 size={16} className="text-neutral-900" />
      </button>
    </div>
  );
}
