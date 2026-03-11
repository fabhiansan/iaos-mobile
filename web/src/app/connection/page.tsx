"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import { AlumniCard } from "@/components/connection/alumni-card";
import { FilterModal } from "@/components/connection/filter-modal";
import { MobilePageLayout, MobilePageHeader, MobileSearchBar } from "@/components/ui/mobile-page-layout";

interface Alumni {
  id: string;
  name: string;
  currentPosition: string | null;
  currentCompany: string | null;
  yearOfEntry: number;
  profileImageUrl?: string | null;
  isVerified?: boolean;
}

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];
const COMPANY_OPTIONS = [
  "PT. Pertamina Mining",
  "Badan Riset Inovasi Nasional",
  "ESRI Indonesia",
  "Petronas Energy, ltd.",
  "Universitas Diponegoro",
  "Badan Meteorologi Klimatologi dan Geofisika",
  "PT Apexindo Pratama Duta Tbk",
];
const EXPERTISE_OPTIONS = [
  "Oceanography",
  "Marine Research",
  "GIS",
  "Offshore Engineering",
  "Marine Spatial Planning",
];

type FilterType = "yearOfEntry" | "company" | "expertise";

const FILTER_CHIPS: { label: string; key: FilterType }[] = [
  { label: "Year of Entry", key: "yearOfEntry" },
  { label: "Company Name", key: "company" },
  { label: "Area of Expertise", key: "expertise" },
];

export default function ConnectionPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);

  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedYears.length === 1) params.set("yearOfEntry", selectedYears[0]);
      const res = await fetch(`/api/connections?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAlumni(json.data ?? []);
        setTotal(json.total ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch alumni:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedYears]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAlumni();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchAlumni]);

  function getFilterProps(filter: FilterType) {
    switch (filter) {
      case "yearOfEntry":
        return {
          title: "Year of Entry",
          options: YEAR_OPTIONS,
          selected: selectedYears,
          onApply: (values: string[]) => {
            setSelectedYears(values);
            setActiveFilter(null);
          },
        };
      case "company":
        return {
          title: "Company Name",
          options: COMPANY_OPTIONS,
          selected: selectedCompanies,
          onApply: (values: string[]) => {
            setSelectedCompanies(values);
            setActiveFilter(null);
          },
        };
      case "expertise":
        return {
          title: "Area of Expertise",
          options: EXPERTISE_OPTIONS,
          selected: selectedExpertise,
          onApply: (values: string[]) => {
            setSelectedExpertise(values);
            setActiveFilter(null);
          },
        };
    }
  }

  return (
    <MobilePageLayout activeItem="connection">
      {({ onMenuOpen }) => (
        <>
          <MobilePageHeader title="Alumni Directory" onMenuOpen={onMenuOpen} />

          <div className="flex flex-col gap-4 pt-2 pb-24">
            <div className="flex flex-col gap-3">
              <MobileSearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search alumni..." />
              <div className="flex items-center gap-2 px-4">
                {FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setActiveFilter(chip.key)}
                    className="flex items-center gap-1 bg-white border border-brand-800 rounded-lg px-2 py-2 cursor-pointer"
                  >
                    <span className="font-[family-name:var(--font-inter)] text-xs font-medium text-brand-800 whitespace-nowrap">
                      {chip.label}
                    </span>
                    <ChevronDown size={14} className="text-brand-800 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4">
              <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800">
                {loading ? "Searching..." : `Found ${total} Alumni`}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="text-brand-600 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-4">
                {alumni.map((a) => (
                  <AlumniCard
                    key={a.id}
                    id={a.id}
                    name={a.name}
                    role={a.currentPosition ?? "Alumni"}
                    company={a.currentCompany ?? "-"}
                    yearOfEntry={a.yearOfEntry}
                    imageUrl={a.profileImageUrl ?? undefined}
                    isVerified={a.isVerified}
                    onViewProfile={() => router.push(`/connection/${a.id}`)}
                  />
                ))}
                {alumni.length === 0 && (
                  <p className="text-center text-sm text-neutral-500 py-8">
                    No alumni found.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Filter Modal */}
          {activeFilter && (
            <FilterModal
              isOpen={!!activeFilter}
              onClose={() => setActiveFilter(null)}
              {...getFilterProps(activeFilter)}
            />
          )}
        </>
      )}
    </MobilePageLayout>
  );
}
