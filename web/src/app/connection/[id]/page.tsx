"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, CalendarDays, CheckCircle, MessageCircle, Loader2 } from "lucide-react";
import Image from "next/image";

interface Career {
  id: string;
  position: string;
  company: string;
  startYear: number;
  endYear: number | null;
  isCurrent: boolean;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  nim: string;
  yearOfEntry: number;
  phone: string;
  profileImageUrl: string | null;
  isVerified: boolean;
  careers: Career[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatYears(career: Career): string {
  const end = career.isCurrent ? "Present" : career.endYear?.toString() ?? "";
  return `${career.startYear} - ${end}`;
}

export default function ProfileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/connections/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Alumni not found" : "Failed to load profile");
          return;
        }
        const json = await res.json();
        setProfile(json.data);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <Loader2 size={32} className="text-brand-600 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-neutral-600 text-sm">{error ?? "Alumni not found"}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-brand-600 text-sm font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  // Derive a role line from current career if available
  const currentCareer = profile.careers.find((c) => c.isCurrent) ?? profile.careers[0];
  const roleText = currentCareer
    ? `${currentCareer.position} at ${currentCareer.company}`
    : "Alumni";

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
              {profile.profileImageUrl ? (
                <div className="w-[72px] h-[72px] rounded-full overflow-hidden">
                  <Image
                    src={profile.profileImageUrl}
                    alt={profile.name}
                    width={72}
                    height={72}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-brand-700 flex items-center justify-center">
                  <span className="font-[family-name:var(--font-work-sans)] text-lg font-semibold text-white">
                    {getInitials(profile.name)}
                  </span>
                </div>
              )}
              {profile.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full">
                  <CheckCircle size={20} className="text-green-600 fill-green-600 stroke-white" />
                </div>
              )}
            </div>

            {/* Name and role */}
            <div className="text-center">
              <h2 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-800">
                {profile.name}
              </h2>
              <p className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-brand-600 mt-1">
                {roleText}
              </p>
            </div>

            {/* Year of entry */}
            <div className="flex items-center gap-1">
              <CalendarDays size={12} className="text-neutral-600" />
              <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-600">
                Year of Entry {profile.yearOfEntry}
              </span>
            </div>

            {/* Verified badge */}
            {profile.isVerified && (
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
                  {profile.email}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                  Phone Number
                </p>
                <p className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-neutral-800">
                  {profile.phone}
                </p>
              </div>
            </div>

            {profile.careers.length > 0 && (
              <>
                <div className="h-px bg-neutral-100" />

                <h3 className="font-[family-name:var(--font-work-sans)] text-base font-medium text-neutral-800">
                  Career History
                </h3>

                <div className="flex flex-col gap-3">
                  {profile.careers.map((career) => (
                    <div key={career.id} className="flex flex-col gap-0.5">
                      <p className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-neutral-800">
                        {career.position}
                      </p>
                      <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                        {career.company}
                      </p>
                      <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                        {formatYears(career)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
