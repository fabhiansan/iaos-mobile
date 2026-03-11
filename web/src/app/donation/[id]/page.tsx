"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, Copy, X } from "lucide-react";
import { AuthHeader } from "@/components/ui/auth-header";
import { CollapsibleSection } from "@/components/donation/collapsible-section";

interface CampaignDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  targetAmount: number;
  currentAmount: number;
  totalRaised: number;
  donorCount: number;
  accountNumber: string;
  bankName: string;
  accountName: string;
  donationInstructions: string | null;
  beneficiaryCount: number | null;
  recentTransactions: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    donorName: string;
    donorYearOfEntry: number;
  }[];
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID").replace(/,/g, ".")}`;
}

function parseInstructions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // not JSON, fall through to newline split
  }
  return raw.split("\n").filter(Boolean);
}

export default function DonationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"detail" | "report">("detail");
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload proof state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAmount, setUploadAmount] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        const res = await fetch(`/api/donations/${params.id}`);
        if (res.ok) {
          const json = await res.json();
          setCampaign(json.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [params.id]);

  async function handleUploadProof() {
    if (!uploadFile || !uploadAmount || !campaign) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("amount", uploadAmount);
      const res = await fetch(`/api/donations/${campaign.id}/upload-proof`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadAmount("");
        // Refresh campaign data
        const refreshRes = await fetch(`/api/donations/${campaign.id}`);
        if (refreshRes.ok) {
          const json = await refreshRes.json();
          setCampaign(json.data);
        }
      }
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <span className="font-[family-name:var(--font-inter)] text-sm text-neutral-500">
          Loading...
        </span>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <span className="font-[family-name:var(--font-inter)] text-sm text-neutral-500">
          Campaign not found.
        </span>
      </div>
    );
  }

  const raisedAmount = Number(campaign.totalRaised) || campaign.currentAmount;
  const progress = Math.round((raisedAmount / campaign.targetAmount) * 100);
  const instructions: string[] = parseInstructions(campaign.donationInstructions);

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative overflow-hidden">
      {/* Gradient blob */}
      <div
        className="absolute -top-[142px] left-1/2 -translate-x-1/2 w-[493px] h-[474px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(101,119,159,0.4) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative z-10">
        <AuthHeader title="Donation Detail" onBack={() => router.back()} />

        <div className="overflow-y-auto px-4 pb-8">
          {/* Hero image */}
          <img
            src={campaign.imageUrl || "/images/donation-placeholder-1.jpg"}
            alt={campaign.title}
            className="w-full h-[222px] rounded-lg object-cover"
          />

          {/* Badge */}
          <div className="mt-3">
            <span className="inline-block bg-brand-100 border border-brand-200 text-brand-800 font-[family-name:var(--font-inter)] text-[10px] px-2 py-0.5 rounded">
              {campaign.category}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-[family-name:var(--font-work-sans)] font-medium text-[22px] leading-[32px] text-neutral-800 mt-2">
            {campaign.title}
          </h2>

          {/* Progress card */}
          <div className="border border-neutral-100 rounded-lg p-2 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-work-sans)] text-2xl font-semibold text-brand-600">
                {formatRupiah(raisedAmount)}
              </span>
              <span className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-brand-800">
                {progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-brand-600 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="font-[family-name:var(--font-inter)] text-sm text-neutral-500 mt-1 block">
              Target: {formatRupiah(campaign.targetAmount)}
            </span>
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white rounded-lg py-2 mt-3 cursor-pointer font-[family-name:var(--font-inter)] text-sm font-medium"
          >
            <Upload size={16} />
            Upload Donation Proof
          </button>

          {/* Tab toggle */}
          <div className="flex mt-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("detail")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer font-[family-name:var(--font-inter)] transition-colors ${
                activeTab === "detail"
                  ? "bg-brand-600 text-white"
                  : "bg-transparent border border-brand-600 text-brand-600"
              }`}
            >
              Donation Detail
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer font-[family-name:var(--font-inter)] transition-colors ${
                activeTab === "report"
                  ? "bg-brand-600 text-white"
                  : "bg-transparent border border-brand-600 text-brand-600"
              }`}
            >
              Donation Report
            </button>
          </div>

          {/* Tab content */}
          <div className="mt-2">
            {activeTab === "detail" && (
              <div className="flex flex-col divide-y divide-neutral-100">
                <CollapsibleSection title="Description" defaultOpen>
                  <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 leading-5 whitespace-pre-line">
                    {campaign.description}
                  </p>
                </CollapsibleSection>

                <CollapsibleSection title="Donation Detail">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                        Account Number
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
                          {campaign.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(campaign.accountNumber)
                          }
                          className="flex items-center gap-1 px-2 py-0.5 bg-brand-50 border border-brand-200 rounded text-brand-600 text-[10px] font-medium cursor-pointer font-[family-name:var(--font-inter)]"
                        >
                          <Copy size={10} />
                          Copy Account Number
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                        Bank
                      </span>
                      <span className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
                        {campaign.bankName}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                        Account Name
                      </span>
                      <span className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-800">
                        {campaign.accountName}
                      </span>
                    </div>
                  </div>
                </CollapsibleSection>

                {instructions.length > 0 && (
                  <CollapsibleSection title="Donation Instruction">
                    <ol className="flex flex-col gap-2 list-decimal list-inside">
                      {instructions.map((instruction, index) => (
                        <li
                          key={index}
                          className="font-[family-name:var(--font-inter)] text-xs text-neutral-600 leading-5"
                        >
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </CollapsibleSection>
                )}
              </div>
            )}

            {activeTab === "report" && (
              <div className="flex flex-col divide-y divide-neutral-100">
                <CollapsibleSection title="Donation Statistic" defaultOpen>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-[family-name:var(--font-inter)] text-xs text-neutral-600">
                        Donation Beneficiaries
                      </span>
                      <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-neutral-800">
                        {campaign.beneficiaryCount ?? 0} Students
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-[family-name:var(--font-inter)] text-xs text-neutral-600">
                        Number of Donors
                      </span>
                      <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-neutral-800">
                        {Number(campaign.donorCount)} Donors
                      </span>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Recent Transactions">
                  {campaign.recentTransactions.length === 0 ? (
                    <p className="font-[family-name:var(--font-inter)] text-xs text-neutral-500">
                      No transactions yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {campaign.recentTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between bg-neutral-50 rounded-lg p-2"
                        >
                          <div>
                            <span className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-neutral-800 block">
                              {tx.donorName}
                            </span>
                            <span className="font-[family-name:var(--font-inter)] text-[10px] text-neutral-500">
                              Class of {tx.donorYearOfEntry}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-[family-name:var(--font-work-sans)] text-xs font-semibold text-brand-600 block">
                              {formatRupiah(tx.amount)}
                            </span>
                            <span
                              className={`font-[family-name:var(--font-inter)] text-[10px] ${
                                tx.status === "verified"
                                  ? "text-green-600"
                                  : tx.status === "rejected"
                                    ? "text-red-500"
                                    : "text-amber-500"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Proof Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative bg-white w-full max-w-[390px] rounded-t-2xl p-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-800">
                Upload Donation Proof
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="cursor-pointer"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="font-[family-name:var(--font-inter)] text-sm text-neutral-700 block mb-1">
                  Donation Amount (Rp)
                </label>
                <input
                  type="number"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-inter)] outline-none focus:border-brand-600"
                />
              </div>

              <div>
                <label className="font-[family-name:var(--font-inter)] text-sm text-neutral-700 block mb-1">
                  Proof Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm font-[family-name:var(--font-inter)]"
                />
              </div>

              <button
                type="button"
                onClick={handleUploadProof}
                disabled={uploading || !uploadFile || !uploadAmount}
                className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium cursor-pointer font-[family-name:var(--font-inter)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Submit Proof"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
