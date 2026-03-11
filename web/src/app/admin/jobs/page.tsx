"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  workingType: string;
  status: "draft" | "published";
  posterName: string | null;
  createdAt: string;
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/jobs?${params}`);
      if (res.ok) {
        const json = await res.json();
        setJobs(json.data);
        setTotal(json.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === "published" ? "draft" : "published";
    const res = await fetch(`/api/admin/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchJobs();
  }

  async function deleteJob(id: string) {
    if (!confirm("Are you sure you want to delete this job?")) return;
    const res = await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
    if (res.ok) fetchJobs();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Job Postings</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search title or company..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border rounded px-2 py-1 text-sm flex-1 max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-neutral-500">No jobs found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-600">
                  <th className="py-1 px-2">Title</th>
                  <th className="py-1 px-2">Company</th>
                  <th className="py-1 px-2">Posted By</th>
                  <th className="py-1 px-2">Status</th>
                  <th className="py-1 px-2">Contract</th>
                  <th className="py-1 px-2">Location</th>
                  <th className="py-1 px-2">Date</th>
                  <th className="py-1 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-neutral-100">
                    <td className="py-1 px-2 font-medium">{job.title}</td>
                    <td className="py-1 px-2">{job.company}</td>
                    <td className="py-1 px-2">{job.posterName || "-"}</td>
                    <td className="py-1 px-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          job.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-1 px-2">{job.contractType}</td>
                    <td className="py-1 px-2">{job.location}</td>
                    <td className="py-1 px-2 whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-1 px-2">
                      <div className="flex gap-1">
                        <Link
                          href={`/admin/jobs/${job.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => toggleStatus(job.id, job.status)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {job.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
