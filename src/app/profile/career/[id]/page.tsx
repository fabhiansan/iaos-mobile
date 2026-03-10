"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CAREER_DATA: Record<string, { position: string; company: string; startYear: string; endYear: string }> = {
  "1": { position: "Chief Executive Officer", company: "PT Eksekusi Teknologi Nusantara", startYear: "2020", endYear: "2026" },
  "2": { position: "Chief Marketing Officer", company: "PT Eksekusi Teknologi Nusantara", startYear: "2017", endYear: "2020" },
  "3": { position: "Head of Marketing", company: "PT Sarana Canggih Semesta", startYear: "2015", endYear: "2017" },
  "4": { position: "Marketing Staff", company: "PT Sarana Canggih Semesta", startYear: "2013", endYear: "2015" },
};

export default function EditCareerFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";
  const existing = !isNew ? CAREER_DATA[id] : null;

  const [position, setPosition] = useState(existing?.position ?? "");
  const [company, setCompany] = useState(existing?.company ?? "");
  const [startYear, setStartYear] = useState(existing?.startYear ?? "");
  const [endYear, setEndYear] = useState(existing?.endYear ?? "");
  const [stillWorkHere, setStillWorkHere] = useState(false);

  const isValid = position !== "" && company !== "" && startYear !== "";

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
            Edit properties field below to update your career
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
            disabled={!isValid}
            onClick={() => router.back()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
