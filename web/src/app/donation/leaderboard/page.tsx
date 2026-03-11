"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Settings } from "lucide-react";
import { LeaderboardPodium } from "@/components/donation/leaderboard-podium";
import { LeaderboardRow } from "@/components/donation/leaderboard-row";
import { ActivateLeaderboardSheet } from "@/components/donation/activate-leaderboard-sheet";

interface YearEntry {
  rank: number;
  name: string;
  amount: number;
  donorCount: number;
}

interface IndividualEntry {
  rank: number;
  name: string;
  year: string;
  amount: number;
  initials: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"yearOfEntry" | "individual">("yearOfEntry");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardActive, setLeaderboardActive] = useState(false);
  const [yearData, setYearData] = useState<YearEntry[]>([]);
  const [individualData, setIndividualData] = useState<IndividualEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch("/api/donations/leaderboard");
        if (res.ok) {
          const json = await res.json();
          setYearData(json.data.byYearOfEntry);
          setIndividualData(json.data.byIndividual);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const data = activeTab === "yearOfEntry" ? yearData : individualData;
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="font-[family-name:var(--font-inter)] text-sm text-neutral-500">
              Loading leaderboard...
            </span>
          </div>
        ) : showIndividualEmpty ? (
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
                initials: "initials" in e ? (e as IndividualEntry).initials : undefined,
                year: "year" in e ? (e as IndividualEntry).year : undefined,
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
                      initials={"initials" in entry ? (entry as IndividualEntry).initials : undefined}
                      year={"year" in entry ? (entry as IndividualEntry).year : undefined}
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
