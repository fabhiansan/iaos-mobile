"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Plus, Loader2 } from "lucide-react";
import { JobCard } from "@/components/career/job-card";
import { FilterSortSheet } from "@/components/career/filter-sort-sheet";
import { MobilePageLayout, MobilePageHeader, MobileSearchBar, MobileFilterChips } from "@/components/ui/mobile-page-layout";
import type { Job } from "@/components/career/job-card";
import { type ApiJob, mapApiJobToJob } from "@/lib/jobs";

const FILTER_CHIPS = ["All Jobs", "Full-time", "Internship", "Remote", "Hybrid"] as const;

type FilterChip = (typeof FILTER_CHIPS)[number];

export default function CareerPage() {
  const router = useRouter();
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
    <MobilePageLayout activeItem="career">
      {({ onMenuOpen }) => (
        <>
          <MobilePageHeader title="Talent Hub" onMenuOpen={onMenuOpen} />

          {/* Search bar */}
          <div className="mt-2">
            <MobileSearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search position or company" />
          </div>

          {/* Filter chips row */}
          <div className="mt-3">
            <MobileFilterChips
              options={FILTER_CHIPS}
              value={activeFilter}
              onChange={(v) => setActiveFilter(v as FilterChip)}
              leading={
                <button type="button" onClick={() => setFilterSheetOpen(!filterSheetOpen)} className="flex items-center gap-1.5 shrink-0 bg-white border border-brand-800 rounded-lg px-3 py-2 cursor-pointer">
                  <SlidersHorizontal size={14} className="text-brand-800" />
                  <span className="font-[family-name:var(--font-inter)] text-xs font-medium text-brand-800">Sort & Filter</span>
                </button>
              }
            />
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

          {/* FAB */}
          <button
            type="button"
            onClick={() => router.push("/career/add")}
            className="fixed bottom-20 right-[calc(50%-195px+16px)] bg-brand-50 border border-brand-200 rounded-xl shadow-md p-4 z-20 cursor-pointer"
          >
            <Plus size={24} className="text-brand-800" />
          </button>

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
        </>
      )}
    </MobilePageLayout>
  );
}
