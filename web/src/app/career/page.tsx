"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, Search, SlidersHorizontal, Plus, Loader2 } from "lucide-react";
import { JobCard } from "@/components/career/job-card";
import { FilterSortSheet } from "@/components/career/filter-sort-sheet";
import { SideDrawer } from "@/components/news/side-drawer";
import { LogoutModal } from "@/components/news/logout-modal";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import type { Job } from "@/components/career/job-card";
import { type ApiJob, mapApiJobToJob } from "@/lib/jobs";

const FILTER_CHIPS = ["All Jobs", "Full-time", "Internship", "Remote", "Hybrid"] as const;

type FilterChip = (typeof FILTER_CHIPS)[number];

export default function CareerPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("All Jobs");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortValue, setSortValue] = useState("date-descending");
  const [filterContractType, setFilterContractType] = useState("All Contract");
  const [filterWorkingType, setFilterWorkingType] = useState("All Type");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      // Map chip filter to API params
      if (activeFilter === "Full-time" || activeFilter === "Internship") {
        params.set("contractType", activeFilter);
      } else if (activeFilter === "Remote" || activeFilter === "Hybrid") {
        params.set("workingType", activeFilter);
      }

      // Map sheet filters
      if (filterContractType !== "All Contract") {
        params.set("contractType", filterContractType);
      }
      if (filterWorkingType !== "All Type") {
        params.set("workingType", filterWorkingType);
      }

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const json = await res.json();
      setJobs((json.data as ApiJob[]).map(mapApiJobToJob));
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, filterContractType, filterWorkingType]);

  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchJobs();
      return;
    }
    const debounce = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchJobs]);

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
        <div className="relative flex items-center justify-center py-4 px-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="absolute left-4 flex items-center justify-center w-10 h-10 cursor-pointer"
          >
            <Menu size={24} className="text-neutral-900" />
          </button>
          <h1 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
            Talent Hub
          </h1>
        </div>

        {/* Search bar */}
        <div className="px-4 mt-2">
          <div className="relative flex items-center h-[56px] bg-neutral-50 border border-brand-200 rounded-lg px-3">
            <input
              type="text"
              placeholder="Search position or company"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 outline-none placeholder:text-neutral-500"
            />
            <Search size={20} className="text-neutral-500 shrink-0 ml-2" />
          </div>
        </div>

        {/* Filter chips row */}
        <div className="flex items-center gap-2 px-4 mt-3">
          {/* Sort & Filter button */}
          <button
            type="button"
            onClick={() => setFilterSheetOpen(!filterSheetOpen)}
            className="flex items-center gap-1.5 shrink-0 bg-white border border-brand-800 rounded-lg px-3 py-2 cursor-pointer"
          >
            <SlidersHorizontal size={14} className="text-brand-800" />
            <span className="font-[family-name:var(--font-inter)] text-xs font-medium text-brand-800">
              Sort & Filter
            </span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-neutral-200 shrink-0" />

          {/* Scrollable chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeFilter === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setActiveFilter(chip)}
                  className={`shrink-0 rounded-lg px-3 py-2 cursor-pointer ${
                    isActive
                      ? "bg-brand-800 text-white"
                      : "bg-white border border-brand-800 text-brand-800"
                  }`}
                >
                  <span className="font-[family-name:var(--font-inter)] text-xs font-medium">
                    {chip}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Job list */}
        <div className="flex flex-col gap-2 px-4 mt-4 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="text-brand-600 animate-spin" />
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={(id) => router.push(`/career/${id}`)}
                />
              ))}

              {jobs.length === 0 && (
                <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 text-center py-8">
                  No jobs found matching your criteria.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => router.push("/career/add")}
        className="fixed bottom-20 right-[calc(50%-195px+16px)] bg-brand-50 border border-brand-200 rounded-xl shadow-md p-4 z-20 cursor-pointer"
      >
        <Plus size={24} className="text-brand-800" />
      </button>

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="career"
        onNavigate={(item) => {
          setDrawerOpen(false);
          if (item !== "career") router.push(`/${item}`);
        }}
        onLogout={() => {
          setDrawerOpen(false);
          setLogoutOpen(true);
        }}
      />

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await signOut({ callbackUrl: "/login" });
        }}
      />

      <FilterSortSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sort={sortValue}
        onSortChange={setSortValue}
        contractType={filterContractType}
        onContractTypeChange={setFilterContractType}
        workingType={filterWorkingType}
        onWorkingTypeChange={setFilterWorkingType}
        onReset={() => {
          setSortValue("date-descending");
          setFilterContractType("All Contract");
          setFilterWorkingType("All Type");
        }}
        onApply={() => setFilterSheetOpen(false)}
      />

      <BottomTabBar activeTab="career" />
    </div>
  );
}
