"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateDonationCampaignPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      title: form.get("title") as string,
      description: form.get("description") as string,
      category: form.get("category") as string,
      targetAmount: Number(form.get("targetAmount")),
      accountNumber: form.get("accountNumber") as string,
      bankName: form.get("bankName") as string,
      accountName: form.get("accountName") as string,
      donationInstructions: (form.get("donationInstructions") as string) || undefined,
      imageUrl: (form.get("imageUrl") as string) || undefined,
    };

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/donations");
      } else {
        const json = await res.json();
        setError(json.error ?? "Failed to create campaign");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold mb-4">Create Donation Campaign</h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded border">
        <div>
          <label className={labelClass}>Title *</label>
          <input name="title" required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description *</label>
          <textarea name="description" required rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Category *</label>
          <select name="category" required className={inputClass}>
            <option value="">Select category</option>
            <option value="Scholarship">Scholarship</option>
            <option value="Events">Events</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Target Amount (IDR) *</label>
          <input name="targetAmount" type="number" min={1} required className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Bank Name *</label>
            <input name="bankName" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Account Number *</label>
            <input name="accountNumber" required className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Account Name *</label>
          <input name="accountName" required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Donation Instructions</label>
          <textarea name="donationInstructions" rows={2} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Image URL</label>
          <input name="imageUrl" type="url" className={inputClass} placeholder="https://..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 text-white text-sm px-4 py-1.5 rounded hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Campaign"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/donations")}
            className="text-sm px-4 py-1.5 rounded border hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
