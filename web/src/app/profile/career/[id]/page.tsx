"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditCareerFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [stillWorkHere, setStillWorkHere] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const fetchCareer = async () => {
      try {
        const res = await fetch(`/api/career-history/${id}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        const entry = json.data;
        setPosition(entry.position ?? "");
        setCompany(entry.company ?? "");
        setStartYear(String(entry.startYear ?? ""));
        setEndYear(entry.endYear != null ? String(entry.endYear) : "");
        setStillWorkHere(entry.isCurrent ?? false);
      } catch (error) {
        console.error("Failed to fetch career entry:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCareer();
  }, [id, isNew]);

  const isValid = position !== "" && company !== "" && startYear !== "";

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      const body = {
        position,
        company,
        startYear: Number(startYear),
        endYear: stillWorkHere ? null : endYear ? Number(endYear) : null,
        isCurrent: stillWorkHere,
      };

      const url = isNew ? "/api/career-history" : `/api/career-history/${id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
      router.back();
    } catch (error) {
      console.error("Failed to save career:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-400">
          Loading...
        </p>
      </div>
    );
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

      <div className="relative z-10 flex flex-col min-h-screen">
        <AuthHeader title={isNew ? "Add Career" : "Edit Career"} onBack={() => router.back()} />

        <div className="px-4 pt-2 pb-4">
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500 leading-5">
            {isNew
              ? "Fill in the fields below to add a new career entry"
              : "Edit properties field below to update your career"}
          </p>
        </div>

        <div className="flex-1 px-4 flex flex-col gap-4">
          <TextInput
            label="Position"
            placeholder="Enter Your Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <TextInput
            label="Company"
            placeholder="Enter your company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <TextInput
                label="Start Year"
                placeholder="Enter Start Year"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <TextInput
                label="End Year"
                placeholder="Enter End Year"
                value={stillWorkHere ? "" : endYear}
                onChange={(e) => setEndYear(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStillWorkHere(!stillWorkHere)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                stillWorkHere ? "bg-brand-600" : "bg-neutral-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  stillWorkHere ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800">
              I am still work here
            </span>
          </div>
        </div>

        <div className="px-4 py-6">
          <Button
            variant={isValid ? "primary" : "disabled"}
            disabled={!isValid || saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
