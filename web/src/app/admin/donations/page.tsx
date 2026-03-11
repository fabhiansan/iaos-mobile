"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

interface Campaign {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  totalRaised: number;
  donorCount: number;
}

export default function AdminDonationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete campaign "${title}"? This will also delete all associated transactions.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/donations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      } else {
        const json = await res.json();
        alert(json.error ?? "Failed to delete");
      }
    } catch {
      alert("Failed to delete campaign");
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading campaigns...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Donation Campaigns</h1>
        <Link
          href="/admin/donations/create"
          className="bg-brand-600 text-white text-sm px-3 py-1.5 rounded hover:bg-brand-700"
        >
          Create Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-neutral-500">No campaigns found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded border">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Title</th>
                <th className="text-left px-3 py-2 font-medium">Category</th>
                <th className="text-right px-3 py-2 font-medium">Target</th>
                <th className="text-right px-3 py-2 font-medium">Raised</th>
                <th className="text-right px-3 py-2 font-medium">Progress</th>
                <th className="text-right px-3 py-2 font-medium">Donors</th>
                <th className="text-right px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c) => {
                const raised = Number(c.totalRaised) || 0;
                const progress = c.targetAmount > 0 ? Math.min((raised / c.targetAmount) * 100, 100) : 0;
                return (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2">{c.title}</td>
                    <td className="px-3 py-2">{c.category}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(c.targetAmount)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(raised)}</td>
                    <td className="px-3 py-2 text-right">
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
                    <td className="px-3 py-2 text-right">{Number(c.donorCount) || 0}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/donations/${c.id}`}
                        className="text-brand-600 hover:underline mr-3"
                      >
                        View/Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id, c.title)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
