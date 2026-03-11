"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, X, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { AdminTable, AdminDeleteModal } from "@/components/admin/admin-table";

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
  reportImages: { id: string; url: string }[];
  reportTestimonies: { id: string; quote: string; name: string; year: string | null }[];
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

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const TX_COLUMNS = [
  { key: "donor", label: "Donor" },
  { key: "amount", label: "Amount", align: "right" as const },
  { key: "proof", label: "Proof" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
  { key: "actions", label: "Actions", align: "right" as const },
];

export default function AdminDonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const editImageRef = useRef<HTMLInputElement>(null);

  // Report state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showTestimonyForm, setShowTestimonyForm] = useState(false);
  const [editingTestimonyId, setEditingTestimonyId] = useState<string | null>(null);
  const [testimonyForm, setTestimonyForm] = useState({ quote: "", name: "", year: "" });
  const [savingTestimony, setSavingTestimony] = useState(false);
  const [deleteTestimonyId, setDeleteTestimonyId] = useState<string | null>(null);
  const [deletingTestimony, setDeletingTestimony] = useState(false);
  const reportPhotoRef = useRef<HTMLInputElement>(null);

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

    let imageUrl: string | undefined;
    const imageFile = editImageRef.current?.files?.[0];
    if (imageFile) {
      const uploadData = new FormData();
      uploadData.append("file", imageFile);
      uploadData.append("folder", "donations");
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
      if (!uploadRes.ok) {
        setEditError("Image upload failed");
        setSaving(false);
        return;
      }
      const uploadJson = await uploadRes.json();
      imageUrl = uploadJson.data.key;
    }

    const body: Record<string, unknown> = {
      title: form.get("title") as string,
      description: editDescription,
      category: form.get("category") as string,
      targetAmount: Number(form.get("targetAmount")),
      accountNumber: form.get("accountNumber") as string,
      bankName: form.get("bankName") as string,
      accountName: form.get("accountName") as string,
      donationInstructions: form.get("donationInstructions") as string,
      beneficiaryCount: Number(form.get("beneficiaryCount")) || 0,
    };
    if (imageUrl !== undefined) {
      body.imageUrl = imageUrl;
    }

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/donations/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/admin/donations");
    } finally {
      setDeleting(false);
      setShowDelete(false);
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

  // Report handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`/api/donations/${id}/report-images`, {
          method: "POST",
          body: formData,
        });
      }
      fetchData();
    } catch {
      alert("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      if (reportPhotoRef.current) reportPhotoRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (imageId: string) => {
    try {
      await fetch(`/api/donations/${id}/report-images/${imageId}`, { method: "DELETE" });
      fetchData();
    } catch {
      alert("Failed to delete photo");
    }
  };

  const handleSaveTestimony = async () => {
    if (!testimonyForm.quote || !testimonyForm.name) return;
    setSavingTestimony(true);
    try {
      const url = editingTestimonyId
        ? `/api/donations/${id}/report-testimonies/${editingTestimonyId}`
        : `/api/donations/${id}/report-testimonies`;
      const method = editingTestimonyId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testimonyForm),
      });
      if (res.ok) {
        setShowTestimonyForm(false);
        setEditingTestimonyId(null);
        setTestimonyForm({ quote: "", name: "", year: "" });
        fetchData();
      }
    } catch {
      alert("Failed to save testimony");
    } finally {
      setSavingTestimony(false);
    }
  };

  const handleDeleteTestimony = async () => {
    if (!deleteTestimonyId) return;
    setDeletingTestimony(true);
    try {
      await fetch(`/api/donations/${id}/report-testimonies/${deleteTestimonyId}`, { method: "DELETE" });
      fetchData();
    } finally {
      setDeletingTestimony(false);
      setDeleteTestimonyId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
      </div>
    );
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

  const inputClass = "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm outline-none focus:border-brand-600";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1";

  return (
    <div className="max-w-4xl space-y-4">
      <Link
        href="/admin/donations"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft size={14} />
        Back to Campaigns
      </Link>

      {/* Campaign Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {editing ? (
          <form onSubmit={handleEdit} className="space-y-3">
            {editError && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">{editError}</div>
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
              <RichTextEditor content={editDescription} onChange={setEditDescription} />
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
            <div>
              <label className={labelClass}>Image</label>
              {campaign.imageUrl && (
                <img
                  src={campaign.imageUrl}
                  alt="Campaign image"
                  className="w-32 h-20 object-cover rounded-md mb-2 border border-neutral-200"
                />
              )}
              <input
                ref={editImageRef}
                type="file"
                accept="image/*"
                className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:bg-neutral-100 file:text-neutral-700"
              />
            </div>
            <div className="flex gap-2 pt-2 border-t border-neutral-100 mt-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 text-sm font-medium border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-neutral-800">{campaign.title}</h1>
                <p className="text-sm text-neutral-500 mt-0.5">{campaign.category}</p>
              </div>
              <button
                onClick={() => { setEditing(true); setEditDescription(campaign.description); }}
                className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 shrink-0"
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>

            <div
              className="article-content text-sm"
              dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(campaign.description) }}
            />

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

            <div className="flex gap-2 pt-4 border-t border-neutral-100">
              <button
                onClick={() => setShowDelete(true)}
                className="px-3 py-2 text-sm font-medium border border-neutral-200 rounded-md text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Section */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-800 mb-2">
          Transactions ({transactions.length})
        </h2>
        <AdminTable
          columns={TX_COLUMNS}
          loading={false}
          empty={transactions.length === 0}
          emptyMessage="No transactions yet."
        >
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-neutral-100 hover:bg-neutral-50">
              <td className="text-sm px-3 py-2">
                {tx.donorName}
                {tx.donorYearOfEntry && (
                  <span className="text-neutral-400 text-xs ml-1">({tx.donorYearOfEntry})</span>
                )}
              </td>
              <td className="text-sm px-3 py-2 text-right whitespace-nowrap">
                {formatCurrency(tx.amount)}
              </td>
              <td className="text-sm px-3 py-2">
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
              <td className="text-sm px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[tx.status] ?? "bg-neutral-100 text-neutral-800"}`}>
                  {tx.status}
                </span>
              </td>
              <td className="text-sm px-3 py-2 whitespace-nowrap text-neutral-500">
                {new Date(tx.createdAt).toLocaleDateString("id-ID")}
              </td>
              <td className="text-sm px-3 py-2 text-right whitespace-nowrap">
                <div className="inline-flex gap-1">
                  {tx.status !== "verified" && (
                    <button
                      onClick={() => handleVerify(tx.id, "verified")}
                      className="rounded-md bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
                    >
                      Verify
                    </button>
                  )}
                  {tx.status !== "rejected" && (
                    <button
                      onClick={() => handleVerify(tx.id, "rejected")}
                      className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      {/* Documentation Photos Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-800">
            Documentation Photos ({campaign.reportImages.length})
          </h2>
          <button
            type="button"
            onClick={() => reportPhotoRef.current?.click()}
            disabled={uploadingPhoto}
            className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            {uploadingPhoto ? "Uploading..." : "Add Photo"}
          </button>
          <input
            ref={reportPhotoRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
        {campaign.reportImages.length === 0 ? (
          <p className="text-sm text-neutral-500">No documentation photos yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {campaign.reportImages.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt="Documentation"
                  className="w-full h-24 object-cover rounded-md border border-neutral-200"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(img.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Beneficiary Testimonies Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-800">
            Beneficiary Testimonies ({campaign.reportTestimonies.length})
          </h2>
          <button
            type="button"
            onClick={() => {
              setShowTestimonyForm(true);
              setEditingTestimonyId(null);
              setTestimonyForm({ quote: "", name: "", year: "" });
            }}
            className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-brand-700 transition-colors"
          >
            <Plus size={14} />
            Add Testimony
          </button>
        </div>

        {showTestimonyForm && (
          <div className="border border-neutral-200 rounded-md p-4 mb-4 space-y-3">
            <div>
              <label className={labelClass}>Quote</label>
              <textarea
                value={testimonyForm.quote}
                onChange={(e) => setTestimonyForm((p) => ({ ...p, quote: e.target.value }))}
                rows={3}
                className={inputClass}
                placeholder="Enter testimony quote..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  value={testimonyForm.name}
                  onChange={(e) => setTestimonyForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                  placeholder="Beneficiary name"
                />
              </div>
              <div>
                <label className={labelClass}>Year (Angkatan)</label>
                <input
                  value={testimonyForm.year}
                  onChange={(e) => setTestimonyForm((p) => ({ ...p, year: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Angkatan 2008"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveTestimony}
                disabled={savingTestimony || !testimonyForm.quote || !testimonyForm.name}
                className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {savingTestimony ? "Saving..." : editingTestimonyId ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setShowTestimonyForm(false); setEditingTestimonyId(null); }}
                className="px-3 py-2 text-sm font-medium border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {campaign.reportTestimonies.length === 0 && !showTestimonyForm ? (
          <p className="text-sm text-neutral-500">No testimonies yet.</p>
        ) : (
          <div className="space-y-3">
            {campaign.reportTestimonies.map((t) => (
              <div key={t.id} className="border border-neutral-100 rounded-md p-3">
                <p className="text-sm text-neutral-700 mb-2">{t.quote}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-neutral-800">{t.name}</span>
                    {t.year && (
                      <span className="text-xs text-neutral-500 ml-2">{t.year}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTestimonyId(t.id);
                        setTestimonyForm({ quote: t.quote, name: t.name, year: t.year || "" });
                        setShowTestimonyForm(true);
                      }}
                      className="p-1 text-neutral-500 hover:text-brand-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTestimonyId(t.id)}
                      className="p-1 text-neutral-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminDeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This will also delete all associated transactions. This action cannot be undone."
        loading={deleting}
      />

      <AdminDeleteModal
        open={!!deleteTestimonyId}
        onClose={() => setDeleteTestimonyId(null)}
        onConfirm={handleDeleteTestimony}
        title="Delete Testimony"
        message="Are you sure you want to delete this testimony?"
        loading={deletingTestimony}
      />
    </div>
  );
}
