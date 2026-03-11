"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Settings } from "lucide-react";
import { LeaderboardPodium } from "@/components/donation/leaderboard-podium";
import { LeaderboardRow } from "@/components/donation/leaderboard-row";
import { ActivateLeaderboardSheet } from "@/components/donation/activate-leaderboard-sheet";

const YEAR_OF_ENTRY_DATA = [
  { rank: 1, name: "2008", amount: 150000000 },
  { rank: 2, name: "2010", amount: 125000000 },
  { rank: 3, name: "2005", amount: 98000000 },
  { rank: 4, name: "Year of Entry 2009", amount: 69000000 },
  { rank: 5, name: "Year of Entry 2012", amount: 40500000 },
  { rank: 6, name: "Year of Entry 2011", amount: 32100000 },
  { rank: 7, name: "Year of Entry 2013", amount: 15500000 },
  { rank: 8, name: "Year of Entry 2003", amount: 13500000 },
];

const INDIVIDUAL_DATA = [
  { rank: 1, name: "Yuniarti R...", year: "2012", amount: 6000000, initials: "" },
  { rank: 2, name: "Dinda Kira...", year: "2012", amount: 5000000, initials: "DK" },
  { rank: 3, name: "Reza Pahle...", year: "2012", amount: 2000000, initials: "" },
  { rank: 4, name: "Michelle Anagata", year: "2014", amount: 1200000, initials: "MI" },
  { rank: 5, name: "Brama Nafarofi Adzkiya", year: "2012", amount: 1100000, initials: "" },
  { rank: 6, name: "Dinni Kamadipa Minarti", year: "2004", amount: 952000, initials: "DK" },
  { rank: 7, name: "Jelita Mawar Purnama", year: "2016", amount: 900000, initials: "" },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"yearOfEntry" | "individual">("yearOfEntry");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardActive, setLeaderboardActive] = useState(false);

  const data = activeTab === "yearOfEntry" ? YEAR_OF_ENTRY_DATA : INDIVIDUAL_DATA;
  const topThree = data.filter((e) => e.rank <= 3);
  const rest = data.filter((e) => e.rank > 3);

  const showIndividualEmpty = activeTab === "individual" && !leaderboardActive;

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative overflow-hidden">
      {/* Gradient blob */}
      <div
        className="absolute -top-[142px] left-1/2 -translate-x-1/2 w-[493px] h-[474px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(101,119,159,0.4) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-2 h-11">
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 cursor-pointer"
          >
            <ChevronLeft size={16} className="text-neutral-900" />
          </button>
          <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
            Jalap Care Leaderboard
          </h1>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 cursor-pointer"
          >
            <Settings size={16} className="text-neutral-900" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="px-4 mt-2">
          <div className="bg-neutral-100 rounded-full p-1 flex">
            <button
              type="button"
              onClick={() => setActiveTab("yearOfEntry")}
              className={`flex-1 text-sm font-medium cursor-pointer font-[family-name:var(--font-inter)] transition-colors ${
                activeTab === "yearOfEntry"
                  ? "bg-brand-600 text-white rounded-full px-6 py-2"
                  : "text-neutral-500 px-6 py-2"
              }`}
            >
              Year of Entry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("individual")}
              className={`flex-1 text-sm font-medium cursor-pointer font-[family-name:var(--font-inter)] transition-colors ${
                activeTab === "individual"
                  ? "bg-brand-600 text-white rounded-full px-6 py-2"
                  : "text-neutral-500 px-6 py-2"
              }`}
            >
              Individual
            </button>
          </div>
        </div>

        {showIndividualEmpty ? (
          <div className="flex flex-col items-center justify-center px-8 pt-20 gap-3">
            <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-800 text-center">
              No Leaderboard showed
            </h3>
            <p className="font-[family-name:var(--font-inter)] text-xs text-neutral-500 text-center leading-5">
              You cannot display the individual leaderboard because you have not
              enabled it in the settings. Activate it in the settings above to
              view the individual leaderboard.
            </p>
          </div>
        ) : (
          <div className="flex flex-col pb-8">
            {/* Podium */}
            <LeaderboardPodium
              entries={topThree.map((e) => ({
                ...e,
                initials: "initials" in e ? (e as typeof INDIVIDUAL_DATA[number]).initials : undefined,
                year: "year" in e ? (e as typeof INDIVIDUAL_DATA[number]).year : undefined,
              }))}
              mode={activeTab}
            />

            {/* Ranking list */}
            {rest.length > 0 && (
              <div className="flex flex-col">
                <h3 className="font-[family-name:var(--font-work-sans)] text-base font-medium text-neutral-800 px-4 py-2">
                  Rangking
                </h3>
                <div className="flex flex-col">
                  {rest.map((entry) => (
                    <LeaderboardRow
                      key={entry.rank}
                      rank={entry.rank}
                      name={entry.name}
                      amount={entry.amount}
                      initials={"initials" in entry ? (entry as typeof INDIVIDUAL_DATA[number]).initials : undefined}
                      year={"year" in entry ? (entry as typeof INDIVIDUAL_DATA[number]).year : undefined}
                      mode={activeTab}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ActivateLeaderboardSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isActive={leaderboardActive}
        onToggle={setLeaderboardActive}
      />
    </div>
  );
}
