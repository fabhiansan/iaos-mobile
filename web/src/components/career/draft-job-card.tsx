import { Building2, MapPin, Users, CheckCircle, Trash2, Edit } from "lucide-react";
import Image from "next/image";
import type { Job } from "./job-card";

interface DraftJobCardProps {
  job: Job;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onPost: (id: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DraftJobCard({ job, onDelete, onEdit, onPost }: DraftJobCardProps) {
  return (
    <div className="bg-white border border-neutral-100 rounded-lg p-2">
      <div className="flex items-start gap-3">
        {/* Company Avatar */}
        <div className="shrink-0">
          {job.companyImage ? (
            <div className="w-14 h-14 rounded-full overflow-hidden">
              <Image
                src={job.companyImage}
                alt={job.company}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand-700 flex items-center justify-center">
              <span className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-white">
                {getInitials(job.company)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-brand-600 leading-tight">
              {job.title}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {job.status === "pending_review" && (
                <span className="font-[family-name:var(--font-inter)] text-[10px] font-medium text-blue-700 bg-blue-100 rounded px-1.5 py-0.5">
                  Pending Review
                </span>
              )}
              <span className="font-[family-name:var(--font-inter)] text-[10px] text-neutral-500">
                {job.timeAgo}
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-[family-name:var(--font-inter)] text-[10px] font-medium text-brand-600 bg-brand-100 border border-brand-200 rounded px-1.5 py-0.5">
              {job.contractType}
            </span>
            <span className="font-[family-name:var(--font-inter)] text-[10px] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 rounded px-1.5 py-0.5">
              {job.workingType}
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1">
              <Building2 size={12} className="text-neutral-600 shrink-0" />
              <span className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-neutral-800 truncate">
                {job.company}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-neutral-600 shrink-0" />
              <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-600 truncate">
                {job.location}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} className="text-[#1e659d] shrink-0" />
              <span className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-[#1e659d] underline truncate">
                {job.postedBy} ({job.postedByDepartment} {job.postedByYear})
              </span>
              <CheckCircle size={12} className="text-green-600 fill-green-600 stroke-white shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-neutral-100 my-2" />

      {/* Action Buttons */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => onDelete(job.id)}
          className="flex-1 flex items-center justify-center gap-1.5 border border-red-500 text-red-500 rounded-lg py-2 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer"
        >
          <Trash2 size={14} />
          Delete Job
        </button>
        {job.status !== "pending_review" && (
          <button
            type="button"
            onClick={() => onEdit(job.id)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-brand-600 text-brand-600 rounded-lg py-2 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer"
          >
            <Edit size={14} />
            Continue Edit
          </button>
        )}
      </div>

      {job.status !== "pending_review" && (
        <button
          type="button"
          onClick={() => onPost(job.id)}
          className="w-full bg-brand-600 text-white rounded-lg py-2 font-[family-name:var(--font-work-sans)] text-sm font-medium cursor-pointer"
        >
          Submit for Review
        </button>
      )}
    </div>
  );
}
