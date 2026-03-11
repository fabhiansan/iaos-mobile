"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  status: "draft" | "published";
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

  async function toggleStatus() {
    if (!job) return;
    const newStatus = job.status === "published" ? "draft" : "published";
    const res = await fetch(`/api/admin/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchJob();
  }

  async function deleteJob() {
    if (!confirm("Are you sure you want to delete this job?")) return;
    const res = await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/jobs");
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  if (!job) {
    return <p className="text-sm text-red-600">Job not found.</p>;
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/jobs" className="text-sm text-blue-600 hover:underline">
        &larr; Back to Jobs
      </Link>

      <h1 className="text-lg font-semibold mt-3 mb-4">{job.title}</h1>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-neutral-500">Company</dt>
        <dd>{job.company}</dd>

        <dt className="text-neutral-500">Location</dt>
        <dd>{job.location}</dd>

        <dt className="text-neutral-500">Contract Type</dt>
        <dd>{job.contractType}</dd>

        <dt className="text-neutral-500">Working Type</dt>
        <dd>{job.workingType}</dd>

        <dt className="text-neutral-500">Contact</dt>
        <dd>
          {job.contactName} &mdash; {job.contactPhone}
        </dd>

        <dt className="text-neutral-500">Posted By</dt>
        <dd>
          {job.posterName || "Unknown"}
          {job.posterYearOfEntry ? ` (${job.posterYearOfEntry})` : ""}
        </dd>

        <dt className="text-neutral-500">Status</dt>
        <dd>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              job.status === "published"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {job.status}
          </span>
        </dd>

        <dt className="text-neutral-500">Created</dt>
        <dd>{new Date(job.createdAt).toLocaleString()}</dd>

        <dt className="text-neutral-500">Updated</dt>
        <dd>{new Date(job.updatedAt).toLocaleString()}</dd>
      </dl>

      <div className="flex gap-2 mt-6">
        <button
          onClick={toggleStatus}
          className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {job.status === "published" ? "Unpublish" : "Publish"}
        </button>
        <button
          onClick={deleteJob}
          className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
