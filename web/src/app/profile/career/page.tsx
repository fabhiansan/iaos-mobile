"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";
import { CareerItem, type Career } from "@/components/profile/career-item";

export default function EditCareerListPage() {
  const router = useRouter();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCareers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/career-history");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCareers(json.data ?? []);
    } catch (error) {
      console.error("Failed to fetch careers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/career-history/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchCareers();
    } catch (error) {
      console.error("Failed to delete career:", error);
    }
  };

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

      <div className="relative z-10 flex flex-col min-h-screen">
        <AuthHeader title="Edit Career" onBack={() => router.back()} />

        <div className="px-4 pt-2 pb-4">
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 leading-5">
            Edit your career below to update your career history in IAOS Connect
          </p>
        </div>

        <div className="flex-1 px-4">
          {/* Add New Career Button */}
          <button
            type="button"
            onClick={() => router.push("/profile/career/new")}
            className="w-full flex items-center justify-center gap-2 py-3 border border-neutral-300 rounded-lg cursor-pointer mb-6"
          >
            <Plus size={16} className="text-neutral-800" />
            <span className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
              Add New Career
            </span>
          </button>

          {/* Saved Career */}
          <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-900 mb-4">
            Saved Career
          </h3>

          {loading ? (
            <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-400">
              Loading...
            </p>
          ) : careers.length === 0 ? (
            <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-400">
              No career entries yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {careers.map((career) => (
                <CareerItem
                  key={career.id}
                  career={career}
                  onEdit={(id) => router.push(`/profile/career/${id}`)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-6">
          <Button variant="primary" onClick={() => router.back()}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
