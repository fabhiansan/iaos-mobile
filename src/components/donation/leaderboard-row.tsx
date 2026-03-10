"use client";

import { Users } from "lucide-react";

interface LeaderboardRowProps {
  rank: number;
  name: string;
  amount: number;
  initials?: string;
  year?: string;
  mode: "yearOfEntry" | "individual";
}

function formatCompactAmount(amount: number): string {
  if (amount >= 1000000) {
    const value = amount / 1000000;
    const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
    return `Rp${formatted} M`;
  }
  return `Rp${Math.round(amount / 1000)} K`;
}

export function LeaderboardRow({
  rank,
  name,
  amount,
  initials,
  year,
  mode,
}: LeaderboardRowProps) {
  return (
    <div className="px-4 py-1">
      <div className="flex items-center gap-3 border border-neutral-100 rounded-lg p-3">
        <span className="font-[family-name:var(--font-inter)] text-sm font-medium text-neutral-500 w-4 text-center shrink-0">
          {rank}
        </span>
        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
          {mode === "yearOfEntry" ? (
            <Users size={20} className="text-neutral-400" />
          ) : (
            <span className="font-[family-name:var(--font-work-sans)] text-xs font-semibold text-brand-800">
              {initials || name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <span className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800 truncate">
            {name}
          </span>
          {mode === "individual" && year && (
            <span className="font-[family-name:var(--font-inter)] text-[10px] text-neutral-500">
              {year}
            </span>
          )}
          <div className="w-16 h-1 bg-brand-600 rounded-full" />
        </div>
        <span className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-brand-600 shrink-0">
          {formatCompactAmount(amount)}
        </span>
      </div>
    </div>
  );
}
