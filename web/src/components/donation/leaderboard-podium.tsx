"use client";

import { Users } from "lucide-react";

interface PodiumEntry {
  rank: number;
  name: string;
  amount: number;
  initials?: string;
  year?: string;
}

interface LeaderboardPodiumProps {
  entries: PodiumEntry[];
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

const rankColors: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-[#F5C842]", text: "text-white" },
  2: { bg: "bg-neutral-400", text: "text-white" },
  3: { bg: "bg-[#CD7F32]", text: "text-white" },
};

export function LeaderboardPodium({ entries, mode }: LeaderboardPodiumProps) {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  const renderEntry = (entry: PodiumEntry, isFirst: boolean) => {
    const iconSize = isFirst ? "w-16 h-16" : "w-12 h-12";
    const containerSize = isFirst ? "w-[130px]" : "w-[100px]";
    const color = rankColors[entry.rank];

    return (
      <div
        className={`${containerSize} flex flex-col items-center gap-1 border border-neutral-100 rounded-xl p-3 ${
          isFirst ? "shadow-sm" : ""
        }`}
      >
        {/* Rank badge */}
        <div className={`w-5 h-5 rounded-full ${color.bg} flex items-center justify-center`}>
          <span className={`font-[family-name:var(--font-inter)] text-[10px] font-bold ${color.text}`}>
            {entry.rank}
          </span>
        </div>

        {/* Icon/Avatar */}
        <div
          className={`${iconSize} rounded-full flex items-center justify-center ${
            isFirst ? "bg-[#FFF8E1]" : "bg-neutral-100"
          }`}
        >
          {mode === "yearOfEntry" ? (
            <Users size={isFirst ? 28 : 20} className="text-brand-800" />
          ) : (
            <span
              className={`font-[family-name:var(--font-work-sans)] font-semibold text-brand-800 ${
                isFirst ? "text-lg" : "text-sm"
              }`}
            >
              {entry.initials || entry.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Name/Year */}
        <span className="font-[family-name:var(--font-work-sans)] text-xs font-semibold text-neutral-800 text-center line-clamp-1 w-full">
          {mode === "yearOfEntry" ? entry.name : entry.name}
        </span>
        {mode === "individual" && entry.year && (
          <span className="font-[family-name:var(--font-inter)] text-[10px] text-neutral-500 -mt-1">
            {entry.year}
          </span>
        )}

        {/* Amount */}
        <span className="font-[family-name:var(--font-work-sans)] text-[10px] font-semibold text-brand-600">
          {mode === "yearOfEntry"
            ? formatCompactAmount(entry.amount)
            : `Rp${entry.amount.toLocaleString("id-ID").replace(/,/g, ".")}`}
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-end justify-center gap-3 px-4 pt-6 pb-4">
      {second && renderEntry(second, false)}
      {first && (
        <div className="-mt-4">{renderEntry(first, true)}</div>
      )}
      {third && renderEntry(third, false)}
    </div>
  );
}

export type { PodiumEntry };
