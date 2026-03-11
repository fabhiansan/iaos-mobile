"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  AdminPageHeader,
  AdminTable,
  AdminPagination,
  AdminDeleteModal,
  AdminActionButton,
} from "@/components/admin/admin-table";

interface Campaign {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  totalRaised: number;
  donorCount: number;
}

const COLUMNS = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "target", label: "Target", align: "right" as const },
  { key: "raised", label: "Raised", align: "right" as const },
  { key: "progress", label: "Progress", align: "right" as const },
  { key: "donors", label: "Donors", align: "right" as const },
  { key: "actions", label: "Actions", align: "right" as const },
];

export default function AdminDonationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/donations");
      const json = await res.json();
      setCampaigns(json.data ?? []);
    } catch {
      console.error("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/donations/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== deleteId));
      } else {
        const json = await res.json();
        alert(json.error ?? "Failed to delete");
      }
    } catch {
      alert("Failed to delete campaign");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader action={{ label: "Create Campaign", href: "/admin/donations/create" }} />

      {/* Table */}
      <AdminTable
        columns={COLUMNS}
        loading={loading}
        empty={campaigns.length === 0}
        emptyMessage="No campaigns found."
      >
        {campaigns.map((c) => {
          const raised = Number(c.totalRaised) || 0;
          const progress = c.targetAmount > 0 ? Math.min((raised / c.targetAmount) * 100, 100) : 0;
          return (
            <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
              <td className="text-sm px-3 py-2">{c.title}</td>
              <td className="text-sm px-3 py-2">{c.category}</td>
              <td className="text-sm px-3 py-2 text-right whitespace-nowrap">
                {formatCurrency(c.targetAmount)}
              </td>
              <td className="text-sm px-3 py-2 text-right whitespace-nowrap">
                {formatCurrency(raised)}
              </td>
              <td className="text-sm px-3 py-2 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-20 h-2 rounded-full bg-neutral-200">
                    <div
                      className="h-2 rounded-full bg-brand-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 w-10 text-right">
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </td>
              <td className="text-sm px-3 py-2 text-right">{Number(c.donorCount) || 0}</td>
              <td className="text-sm px-3 py-2 text-right">
                <div className="inline-flex gap-1">
                  <AdminActionButton
                    variant="edit"
                    href={`/admin/donations/${c.id}`}
                  />
                  <AdminActionButton
                    variant="delete"
                    onClick={() => setDeleteId(c.id)}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Pagination */}
      <AdminPagination
        page={1}
        totalPages={1}
        total={campaigns.length}
        onPageChange={() => {}}
      />

      {/* Delete Confirm Modal */}
      <AdminDeleteModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This will also delete all associated transactions."
        loading={deleting}
      />
    </div>
  );
}
