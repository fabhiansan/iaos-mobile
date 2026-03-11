"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, ToggleLeft } from "lucide-react";
import {
  AdminSearchInput,
  AdminFilterSelect,
  AdminTable,
  AdminPagination,
  AdminDeleteModal,
  AdminActionButton,
  useDebounce,
} from "@/components/admin/admin-table";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  workingType: string;
  status: "draft" | "pending_review" | "published";
  posterName: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Pending Review", value: "pending_review" },
  { label: "Published", value: "published" },
];

const COLUMNS = [
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "postedBy", label: "Posted By" },
  { key: "status", label: "Status" },
  { key: "contract", label: "Contract" },
  { key: "location", label: "Location" },
  { key: "date", label: "Date" },
  { key: "actions", label: "Actions", align: "right" as const },
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/jobs?${params}`);
      if (res.ok) {
        const json = await res.json();
        setJobs(json.data);
        setTotal(json.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function updateStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchJobs();
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/jobs/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchJobs();
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search title or company..."
        />
        <AdminFilterSelect
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
        />
      </div>

      {/* Table */}
      <AdminTable
        columns={COLUMNS}
        loading={loading}
        empty={jobs.length === 0}
        emptyMessage="No jobs found."
      >
        {jobs.map((job) => (
          <tr key={job.id} className="border-b border-neutral-100 hover:bg-neutral-50">
            <td className="text-sm px-3 py-2 font-medium">{job.title}</td>
            <td className="text-sm px-3 py-2">{job.company}</td>
            <td className="text-sm px-3 py-2">{job.posterName || "-"}</td>
            <td className="text-sm px-3 py-2">
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
            </td>
            <td className="text-sm px-3 py-2">{job.contractType}</td>
            <td className="text-sm px-3 py-2">{job.location}</td>
            <td className="text-sm px-3 py-2 whitespace-nowrap">
              {new Date(job.createdAt).toLocaleDateString()}
            </td>
            <td className="text-sm px-3 py-2 text-right">
              <div className="inline-flex gap-1">
                <AdminActionButton
                  variant="view"
                  href={`/admin/jobs/${job.id}`}
                />
                {job.status === "pending_review" && (
                  <>
                    <AdminActionButton
                      variant="edit"
                      icon={CheckCircle}
                      onClick={() => updateStatus(job.id, "published")}
                    />
                    <AdminActionButton
                      variant="edit"
                      icon={XCircle}
                      onClick={() => updateStatus(job.id, "draft")}
                    />
                  </>
                )}
                {job.status === "published" && (
                  <AdminActionButton
                    variant="edit"
                    icon={ToggleLeft}
                    onClick={() => updateStatus(job.id, "draft")}
                  />
                )}
                <AdminActionButton
                  variant="delete"
                  onClick={() => setDeleteId(job.id)}
                />
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* Delete Confirm Modal */}
      <AdminDeleteModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Job"
        message="Are you sure you want to delete this job posting? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
