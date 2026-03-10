"use client";

import { ChevronRight } from "lucide-react";

interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  currentAmount: number;
  targetAmount: number;
}

interface DonationCardProps {
  campaign: DonationCampaign;
  onClick?: (id: string) => void;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID").replace(/,/g, ".")}`;
}

export function DonationCard({ campaign, onClick }: DonationCardProps) {
  const progress = Math.round(
    (campaign.currentAmount / campaign.targetAmount) * 100
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Hero image */}
      <div className="w-full h-[222px] overflow-hidden rounded-lg">
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title + Badge */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 font-[family-name:var(--font-work-sans)] text-base font-medium leading-6 text-neutral-800">
            {campaign.title}
          </h3>
          <span className="shrink-0 inline-flex items-center bg-brand-100 border border-brand-200 text-brand-800 font-[family-name:var(--font-inter)] text-[10px] px-2 py-0.5 rounded mt-1">
            {campaign.category}
          </span>
        </div>
        <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 leading-5 line-clamp-2">
          {campaign.description}
        </p>
      </div>

      {/* Amount + Progress */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-brand-600">
            {formatRupiah(campaign.currentAmount)}
          </span>
          <span className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500">
            /{formatRupiah(campaign.targetAmount)}
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Lihat Detail */}
      <button
        type="button"
        onClick={() => onClick?.(campaign.id)}
        className="flex items-center justify-between cursor-pointer"
      >
        <span className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-brand-600">
          Lihat Detail
        </span>
        <ChevronRight size={16} className="text-brand-600" />
      </button>
    </div>
  );
}

export type { DonationCampaign };
