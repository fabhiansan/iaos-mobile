"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, CalendarDays, CheckCircle, MessageCircle } from "lucide-react";
import Image from "next/image";

const PROFILE = {
  id: "1",
  name: "Bagus Budiawan",
  role: "Senior Lecturer at Universitas Diponegoro",
  yearOfEntry: 2005,
  isVerified: true,
  imageUrl: "/images/alumni-1.jpg",
  email: "budsans@gmail.com",
  phone: "+62 812 8491 2857",
  careers: [
    {
      title: "CEO",
      company: "PT Eksekusi Teknologi Nusantara",
      years: "2020 - Recent",
    },
    {
      title: "CMO",
      company: "PT Eksekusi Teknologi Nusantara",
      years: "2017 - 2020",
    },
    {
      title: "Head of Marketing",
      company: "PT Sarana Canggih Semesta",
      years: "2015 - 2017",
    },
    {
      title: "Marketing Staff",
      company: "PT Sarana Canggih Semesta",
      years: "2013 - 2015",
    },
  ],
};

export default function ProfileDetailPage() {
  const router = useRouter();

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
            <ChevronLeft size={20} className="text-neutral-900" />
          </button>
          <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900 text-center">
            Profile Detail
          </h1>
          {/* Spacer to keep title centered */}
          <div className="w-5 shrink-0" />
        </div>

        <div className="flex flex-col gap-4 pt-4 pb-8 px-4">
          {/* Profile Card */}
          <div className="bg-white border border-neutral-100 rounded-lg p-4 flex flex-col items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden">
                <Image
                  src={PROFILE.imageUrl}
                  alt={PROFILE.name}
                  width={72}
                  height={72}
                  className="w-full h-full object-cover"
                />
              </div>
              {PROFILE.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full">
                  <CheckCircle size={20} className="text-green-600 fill-green-600 stroke-white" />
                </div>
              )}
            </div>

            {/* Name and role */}
            <div className="text-center">
              <h2 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-800">
                {PROFILE.name}
              </h2>
              <p className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-brand-600 mt-1">
                {PROFILE.role}
              </p>
            </div>

            {/* Year of entry */}
            <div className="flex items-center gap-1">
              <CalendarDays size={12} className="text-neutral-600" />
              <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-600">
                Year of Entry {PROFILE.yearOfEntry}
              </span>
            </div>

            {/* Verified badge */}
            {PROFILE.isVerified && (
              <span className="inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-medium font-[family-name:var(--font-work-sans)] border bg-green-600 border-green-500 text-white">
                Verified
              </span>
            )}

            {/* Message button */}
            <button
              type="button"
              className="w-full bg-brand-600 text-white rounded-lg py-3 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} />
              Message Alumni
            </button>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white border border-neutral-100 rounded-lg p-4 flex flex-col gap-3">
            <h3 className="font-[family-name:var(--font-work-sans)] text-base font-medium text-neutral-800">
              Contact Information
            </h3>

            <div className="flex flex-col gap-2">
              <div>
                <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                  Email
                </p>
                <p className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-neutral-800">
                  {PROFILE.email}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                  Phone Number
                </p>
                <p className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-neutral-800">
                  {PROFILE.phone}
                </p>
              </div>
            </div>

            <div className="h-px bg-neutral-100" />

            <h3 className="font-[family-name:var(--font-work-sans)] text-base font-medium text-neutral-800">
              Career History
            </h3>

            <div className="flex flex-col gap-3">
              {PROFILE.careers.map((career, index) => (
                <div key={index} className="flex flex-col gap-0.5">
                  <p className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-neutral-800">
                    {career.title}
                  </p>
                  <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                    {career.company}
                  </p>
                  <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                    {career.years}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
