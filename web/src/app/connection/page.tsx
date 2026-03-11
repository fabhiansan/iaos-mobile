"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, Loader2 } from "lucide-react";
import { AlumniCard } from "@/components/connection/alumni-card";
import { AlumniSearch } from "@/components/connection/alumni-search";
import { FilterModal } from "@/components/connection/filter-modal";
import { SideDrawer } from "@/components/news/side-drawer";
import { LogoutModal } from "@/components/news/logout-modal";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";

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

export default function ConnectionPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
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
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 cursor-pointer"
          >
            <Menu size={16} className="text-neutral-900" />
          </button>
          <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900 text-center">
            Alumni Directory
          </h1>
          {/* Spacer to keep title centered */}
          <div className="w-4 shrink-0" />
        </div>

        <div className="flex flex-col gap-4 pt-2 pb-24">
          <AlumniSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterClick={(filter) => setActiveFilter(filter)}
          />

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
      </div>

      {/* Filter Modal */}
      {activeFilter && (
        <FilterModal
          isOpen={!!activeFilter}
          onClose={() => setActiveFilter(null)}
          {...getFilterProps(activeFilter)}
        />
      )}

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="connection"
        onNavigate={(item) => {
          setDrawerOpen(false);
          if (item !== "connection") router.push(`/${item}`);
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

      <BottomTabBar />
    </div>
  );
}
