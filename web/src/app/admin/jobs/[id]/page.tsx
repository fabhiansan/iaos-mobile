"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminDeleteModal } from "@/components/admin/admin-table";

interface JobDetail {
  id: string;
  title: string;
  company: string;
  companyImageUrl: string | null;
  location: string;
  contractType: string;
  workingType: string;
  contactName: string;
  contactPhone: string;
  status: "draft" | "pending_review" | "published";
  postedById: string;
  posterName: string | null;
  posterYearOfEntry: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${id}`);
      if (res.ok) {
        const json = await res.json();
        setJob(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  async function updateStatus(newStatus: string) {
    if (!job) return;
    const res = await fetch(`/api/admin/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchJob();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/admin/jobs");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-6 w-64 animate-pulse rounded bg-neutral-200" />
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div>
        <p className="text-sm text-neutral-500 mb-2">Job not found.</p>
        <Link href="/admin/jobs" className="text-sm text-brand-600 hover:underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Company", value: job.company },
    { label: "Location", value: job.location },
    { label: "Contract Type", value: job.contractType },
    { label: "Working Type", value: job.workingType },
    {
      label: "Contact",
      value: `${job.contactName} — ${job.contactPhone}`,
    },
    {
      label: "Posted By",
      value: `${job.posterName || "Unknown"}${job.posterYearOfEntry ? ` (${job.posterYearOfEntry})` : ""}`,
    },
    {
      label: "Status",
      value: (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            job.status === "published"
              ? "bg-green-100 text-green-800"
              : job.status === "pending_review"
              ? "bg-blue-100 text-blue-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {job.status === "pending_review" ? "pending review" : job.status}
        </span>
      ),
    },
    { label: "Created", value: new Date(job.createdAt).toLocaleString() },
    { label: "Updated", value: new Date(job.updatedAt).toLocaleString() },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <Link
        href="/admin/jobs"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft size={14} />
        Back to Jobs
      </Link>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-lg font-semibold text-neutral-800 mb-4">{job.title}</h1>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          {fields.map((f) => (
            <Fragment key={f.label}>
              <dt className="text-neutral-500 font-medium">{f.label}</dt>
              <dd className="text-neutral-800">{f.value}</dd>
            </Fragment>
          ))}
        </dl>

        <div className="flex gap-2 mt-6 pt-4 border-t border-neutral-100">
          {job.status === "pending_review" && (
            <>
              <button
                onClick={() => updateStatus("published")}
                className="inline-flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus("draft")}
                className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {job.status === "published" && (
            <button
              onClick={() => updateStatus("draft")}
              className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-brand-700 transition-colors"
            >
              Unpublish
            </button>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="px-3 py-2 text-sm font-medium border border-neutral-200 rounded-md text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <AdminDeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Job"
        message="Are you sure you want to delete this job posting? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
