"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const CATEGORIES = ["Scholarship", "Events"] as const;

export default function CreateDonationCampaignPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        uploadData.append("folder", "donations");
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Image upload failed");
        }
        const uploadJson = await uploadRes.json();
        imageUrl = uploadJson.data.key;
      }

      const form = new FormData(e.currentTarget as HTMLFormElement);
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title") as string,
          description,
          category: form.get("category") as string,
          targetAmount: Number(form.get("targetAmount")),
          accountNumber: form.get("accountNumber") as string,
          bankName: form.get("bankName") as string,
          accountName: form.get("accountName") as string,
          donationInstructions: (form.get("donationInstructions") as string) || undefined,
          imageUrl,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create campaign");
      }

      router.push("/admin/donations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-600";

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-lg font-semibold text-neutral-800 mb-6">Create Donation Campaign</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
            <input name="title" type="text" required className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <RichTextEditor content={description} onChange={setDescription} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
            <select name="category" required className={inputClass}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Target Amount (IDR)</label>
            <input name="targetAmount" type="number" min={1} required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Bank Name</label>
              <input name="bankName" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Account Number</label>
              <input name="accountNumber" required className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Account Name</label>
            <input name="accountName" required className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Donation Instructions</label>
            <textarea name="donationInstructions" rows={2} className={`${inputClass} resize-y`} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-neutral-100 file:text-neutral-700"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Campaign"}
            </button>
            <Link
              href="/admin/donations"
              className="border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
