"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AuthHeader } from "@/components/ui/auth-header";
import { Button } from "@/components/ui/button";

interface Career {
  id: string;
  position: string;
  company: string;
  startYear: string;
  endYear: string;
}

const INITIAL_CAREERS: Career[] = [
  {
    id: "1",
    position: "Chief Executive Officer",
    company: "PT Eksekusi Teknologi Nusantara",
    startYear: "2020",
    endYear: "Recent",
  },
  {
    id: "2",
    position: "Chief Marketing Officer",
    company: "PT Eksekusi Teknologi Nusantara",
    startYear: "2017",
    endYear: "2020",
  },
  {
    id: "3",
    position: "Head of Marketing",
    company: "PT Sarana Canggih Semesta",
    startYear: "2015",
    endYear: "2017",
  },
  {
    id: "4",
    position: "Marketing Staff",
    company: "PT Sarana Canggih Semesta",
    startYear: "2013",
    endYear: "2015",
  },
];

export default function EditCareerListPage() {
  const router = useRouter();
  const [careers, setCareers] = useState<Career[]>(INITIAL_CAREERS);

  const handleDelete = (id: string) => {
    setCareers((prev) => prev.filter((c) => c.id !== id));
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

          <div className="flex flex-col gap-4">
            {careers.map((career) => (
              <div key={career.id} className="flex flex-col gap-2">
                <p className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-neutral-900">
                  {career.position}
                </p>
                <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                  {career.company}
                </p>
                <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                  {career.startYear} - {career.endYear}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(career.id)}
                    className="flex-1 !border-red-500 !text-red-500 !py-2 !text-xs"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/profile/career/${career.id}`)}
                    className="flex-1 !py-2 !text-xs"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
