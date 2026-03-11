import type { Job } from "@/components/career/job-card";

export interface ApiJob {
  id: string;
  title: string;
  company: string;
  companyImageUrl: string | null;
  companyImageSignedUrl?: string | null;
  location: string;
  contractType: string;
  workingType: string;
  contactName: string;
  contactPhone: string;
  status: string;
  postedById: string;
  createdAt: string;
  updatedAt: string;
  posterName: string | null;
  posterYearOfEntry: number | null;
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w ago`;
}

export function mapApiJobToJob(j: ApiJob): Job {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    companyImage: j.companyImageSignedUrl || undefined,
    location: j.location,
    postedBy: j.posterName || "Unknown",
    postedByDepartment: "Oceanography",
    postedByYear: j.posterYearOfEntry?.toString() || "",
    contractType: j.contractType,
    workingType: j.workingType,
    timeAgo: timeAgo(j.createdAt),
    whatsappLink: j.contactPhone
      ? `https://wa.me/${j.contactPhone.replace(/[^0-9]/g, "")}`
      : undefined,
  };
}

export function mapDraftToJob(d: ApiJob): Job {
  return {
    id: d.id,
    title: d.title,
    company: d.company,
    location: d.location,
    postedBy: d.posterName || "Unknown",
    postedByDepartment: "Oceanography",
    postedByYear: d.posterYearOfEntry?.toString() || "",
    contractType: d.contractType,
    workingType: d.workingType,
    timeAgo: timeAgo(d.updatedAt),
  };
}
