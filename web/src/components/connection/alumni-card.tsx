import { Building2, CalendarDays, CheckCircle } from "lucide-react";
import Image from "next/image";

interface AlumniCardProps {
  id: string;
  name: string;
  role: string;
  company: string;
  yearOfEntry: number;
  imageUrl?: string;
  isVerified?: boolean;
  onViewProfile: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AlumniCard({
  name,
  role,
  company,
  yearOfEntry,
  imageUrl,
  isVerified,
  onViewProfile,
}: AlumniCardProps) {
  return (
    <div className="bg-white border border-neutral-100 rounded-lg p-2 overflow-hidden">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {imageUrl ? (
            <div className="w-14 h-14 rounded-full overflow-hidden">
              <Image
                src={imageUrl}
                alt={name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand-700 flex items-center justify-center">
              <span className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-white">
                {getInitials(name)}
              </span>
            </div>
          )}
          {isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full">
              <CheckCircle size={16} className="text-green-600 fill-green-600 stroke-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-800 leading-tight">
            {name}
          </p>
          <p className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-brand-600 mt-0.5">
            {role}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 min-w-0">
              <Building2 size={12} className="text-neutral-600 shrink-0" />
              <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-600 truncate">
                {company}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <CalendarDays size={12} className="text-neutral-600" />
              <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-600">
                {yearOfEntry}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-neutral-100 my-2" />

      <button
        type="button"
        onClick={onViewProfile}
        className="w-full bg-brand-800 text-white rounded-lg py-2 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer"
      >
        View Profile
      </button>
    </div>
  );
}
