"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  targetAmount: number;
  currentAmount: number;
  accountNumber: string;
  bankName: string;
  accountName: string;
  donationInstructions: string | null;
  beneficiaryCount: number | null;
  totalRaised: number;
  donorCount: number;
}

interface Transaction {
  id: string;
  amount: number;
  status: "pending" | "verified" | "rejected";
  proofImageUrl: string;
  createdAt: string;
  verifiedAt: string | null;
  donorName: string;
  donorYearOfEntry: string | null;
}

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    verified: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return `text-xs px-2 py-0.5 rounded-full ${styles[status] ?? "bg-neutral-100 text-neutral-800"}`;
};

export default function AdminDonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [campRes, txRes] = await Promise.all([
        fetch(`/api/donations/${id}`),
        fetch(`/api/donations/${id}/transactions`),
      ]);
      const campJson = await campRes.json();
      const txJson = await txRes.json();
      setCampaign(campJson.data ?? null);
      setTransactions(txJson.data ?? []);
    } catch {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setEditError("");

    const form = new FormData(e.currentTarget);
    const body = {
      title: form.get("title") as string,
      description: form.get("description") as string,
      category: form.get("category") as string,
      targetAmount: Number(form.get("targetAmount")),
      accountNumber: form.get("accountNumber") as string,
      bankName: form.get("bankName") as string,
      accountName: form.get("accountName") as string,
      donationInstructions: form.get("donationInstructions") as string,
      beneficiaryCount: Number(form.get("beneficiaryCount")) || 0,
    };

    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditing(false);
        fetchData();
      } else {
        const json = await res.json();
        setEditError(json.error ?? "Failed to update");
      }
    } catch {
      setEditError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (txId: string, status: "verified" | "rejected") => {
    try {
      const res = await fetch(`/api/donations/${id}/transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const json = await res.json();
        alert(json.error ?? "Failed to update transaction");
      }
    } catch {
      alert("Failed to update transaction");
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  if (!campaign) {
    return (
      <div>
        <p className="text-sm text-neutral-500 mb-2">Campaign not found.</p>
        <Link href="/admin/donations" className="text-sm text-brand-600 hover:underline">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const raised = Number(campaign.totalRaised) || 0;
  const progress = campaign.targetAmount > 0 ? Math.min((raised / campaign.targetAmount) * 100, 100) : 0;

  const inputClass = "w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/donations" className="text-sm text-brand-600 hover:underline">
          &larr; Campaigns
        </Link>
        <h1 className="text-lg font-semibold">{campaign.title}</h1>
      </div>

      {/* Campaign Info Section */}
      <div className="bg-white rounded border p-4">
        {editing ? (
          <form onSubmit={handleEdit} className="space-y-3">
            {editError && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded">{editError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Title</label>
                <input name="title" defaultValue={campaign.title} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select name="category" defaultValue={campaign.category} required className={inputClass}>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Events">Events</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea name="description" defaultValue={campaign.description} required rows={3} className={inputClass} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Target Amount</label>
                <input name="targetAmount" type="number" defaultValue={campaign.targetAmount} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input name="bankName" defaultValue={campaign.bankName} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input name="accountNumber" defaultValue={campaign.accountNumber} required className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Account Name</label>
                <input name="accountName" defaultValue={campaign.accountName} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Beneficiary Count</label>
                <input name="beneficiaryCount" type="number" defaultValue={campaign.beneficiaryCount ?? 0} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Donation Instructions</label>
              <textarea name="donationInstructions" defaultValue={campaign.donationInstructions ?? ""} rows={2} className={inputClass} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="bg-brand-600 text-white text-sm px-3 py-1.5 rounded hover:bg-brand-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm px-3 py-1.5 rounded border hover:bg-neutral-50">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500">{campaign.category}</p>
                <p className="text-sm mt-1">{campaign.description}</p>
              </div>
              <button onClick={() => setEditing(true)} className="text-sm text-brand-600 hover:underline shrink-0">
                Edit
              </button>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-neutral-500">Target:</span> {formatCurrency(campaign.targetAmount)}
              </div>
              <div>
                <span className="text-neutral-500">Raised:</span> {formatCurrency(raised)}
              </div>
              <div>
                <span className="text-neutral-500">Donors:</span> {Number(campaign.donorCount) || 0}
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-200">
              <div className="h-2 rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-neutral-500">Bank:</span> {campaign.bankName}</div>
              <div><span className="text-neutral-500">Account:</span> {campaign.accountNumber}</div>
              <div><span className="text-neutral-500">Name:</span> {campaign.accountName}</div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Section */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Transactions ({transactions.length})</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-neutral-500">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Donor</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 font-medium">Proof</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-right px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2">
                      {tx.donorName}
                      {tx.donorYearOfEntry && (
                        <span className="text-neutral-400 text-xs ml-1">({tx.donorYearOfEntry})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                    <td className="px-3 py-2">
                      {tx.proofImageUrl ? (
                        <a
                          href={tx.proofImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline text-xs"
                        >
                          View proof
                        </a>
                      ) : (
                        <span className="text-neutral-400 text-xs">No proof</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={statusBadge(tx.status)}>{tx.status}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-neutral-500">
                      {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {tx.status !== "verified" && (
                        <button
                          onClick={() => handleVerify(tx.id, "verified")}
                          className="text-green-600 hover:underline text-xs mr-2"
                        >
                          Verify
                        </button>
                      )}
                      {tx.status !== "rejected" && (
                        <button
                          onClick={() => handleVerify(tx.id, "rejected")}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
