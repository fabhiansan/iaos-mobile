"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, Copy } from "lucide-react";
import { AuthHeader } from "@/components/ui/auth-header";
import { CollapsibleSection } from "@/components/donation/collapsible-section";

const CAMPAIGN_DETAIL = {
  id: "1",
  title: "Educational Support Program for the Children of Alumni",
  category: "Scholarship",
  imageUrl: "/images/donation-placeholder-1.jpg",
  currentAmount: 45000000,
  targetAmount: 60000000,
  description: `Halo Rekan Alumni, banyak dari saudara kita sesama alumni Oseanografi yang saat ini sedang berjuang untuk memberikan pendidikan terbaik bagi putra-putri mereka di tengah himpitan ekonomi pasca-pandemi.

Melalui program "Jalap Care: Pendidikan Untuk Semua", kita berikhtiar untuk mengumpulkan dana bantuan biaya sekolah bagi 15 keluarga alumni yang membutuhkan. Bantuan ini akan mencakup SPP, buku, dan seragam sekolah.

Untuk memberikan donasi, silakan transfer ke rekening BCA dengan nomor 12345678. Setelah itu, unggah bukti transfer Anda melalui menu yang telah disediakan. Setiap donasi sangat berarti bagi anak-anak penerus bangsa!`,
  accountNumber: "12345678",
  bankName: "Bank Central Asia",
  accountName: "Ikatan Alumni Oseanografi ITB",
  donationInstructions: [
    "View Detail Donation",
    "Copy Account Number for transfer donation",
    "Make sure the Account Number, Bank Name, and Account Name are correct",
    "Transfer the donation",
    'Select "Upload Donation Proof"',
    "Upload your donation proof",
    "Your donation confirmed",
  ],
  beneficiaryCount: 15,
  donorCount: 120,
  documentationImages: [
    "/images/donation-doc-1.jpg",
    "/images/donation-doc-2.jpg",
    "/images/donation-doc-3.jpg",
  ],
  testimonials: [
    {
      id: "1",
      quote:
        "Terima kasih banyak kepada rekan-rekan alumni Oseanografi. Bantuan ini sangat berarti agar anak saya bisa melanjutkan sekolah tanpa hambatan biaya. Semoga kebaikan kalian dibalas Tuhan.",
      name: "Budi Santoso",
      year: "Angkatan 2008",
    },
    {
      id: "2",
      quote:
        "Terima kasih banyak kepada rekan-rekan alumni Oseanografi. Bantuan ini sangat berarti agar anak saya bisa melanjutkan sekolah tanpa hambatan biaya. Semoga kebaikan kalian dibalas Tuhan.",
      name: "Budi Santoso",
      year: "Angkatan 2008",
    },
  ],
};

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID").replace(/,/g, ".")}`;
}

export default function DonationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"detail" | "report">("detail");

  // In a real app, fetch campaign by params.id
  const campaign = CAMPAIGN_DETAIL;
  const progress = Math.round(
    (campaign.currentAmount / campaign.targetAmount) * 100
  );

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
            src={campaign.imageUrl}
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
                {formatRupiah(campaign.currentAmount)}
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

                <CollapsibleSection title="Donation Instruction">
                  <ol className="flex flex-col gap-2 list-decimal list-inside">
                    {campaign.donationInstructions.map((instruction, index) => (
                      <li
                        key={index}
                        className="font-[family-name:var(--font-inter)] text-xs text-neutral-600 leading-5"
                      >
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </CollapsibleSection>
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
                        {campaign.beneficiaryCount} Students
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-[family-name:var(--font-inter)] text-xs text-neutral-600">
                        Number of Donors
                      </span>
                      <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-neutral-800">
                        {campaign.donorCount} Donors
                      </span>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Documentation">
                  <div className="grid grid-cols-3 gap-2">
                    {campaign.documentationImages.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Documentation ${index + 1}`}
                        className="rounded-lg aspect-square object-cover w-full"
                      />
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Beneficiaries Testimonies">
                  <div className="flex flex-col gap-3">
                    {campaign.testimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="bg-brand-50 rounded-lg p-3"
                      >
                        <p className="font-[family-name:var(--font-inter)] text-xs text-neutral-700 leading-5 italic">
                          &ldquo;{testimonial.quote}&rdquo;
                        </p>
                        <div className="mt-2">
                          <span className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-neutral-800">
                            {testimonial.name}
                          </span>
                          <span className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500 ml-2">
                            Class of {testimonial.year}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
