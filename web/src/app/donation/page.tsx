"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Search } from "lucide-react";
import { DonationCard } from "@/components/donation/donation-card";
import {
  MobilePageLayout,
  MobilePageHeader,
  MobileHeaderAction,
  MobileFilterChips,
} from "@/components/ui/mobile-page-layout";
import type { DonationCampaign } from "@/components/donation/donation-card";

const CATEGORIES = ["All Donations", "Scholarship", "Events"];

interface CampaignResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  targetAmount: number;
  currentAmount: number;
  totalRaised: number;
  donorCount: number;
}

export default function DonationPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All Donations");
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      try {
        const query = activeCategory !== "All Donations" ? `?category=${activeCategory}` : "";
        const res = await fetch(`/api/donations${query}`);
        if (res.ok) {
          const json = await res.json();
          const mapped: DonationCampaign[] = (json.data as CampaignResponse[]).map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category,
            imageUrl: c.imageUrl || "/images/donation-placeholder-1.jpg",
            currentAmount: Number(c.totalRaised) || c.currentAmount,
            targetAmount: c.targetAmount,
          }));
          setCampaigns(mapped);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, [activeCategory]);

  return (
    <MobilePageLayout activeItem="donation">
      {({ onMenuOpen }) => (
        <>
          <MobilePageHeader
            title="Jalap Care Donation"
            onMenuOpen={onMenuOpen}
            rightActions={
              <MobileHeaderAction
                icon={BarChart3}
                onClick={() => router.push("/donation/leaderboard")}
              />
            }
          />

          <div className="flex flex-col gap-6 pt-2 pb-24">
            <MobileFilterChips
              options={CATEGORIES}
              value={activeCategory}
              onChange={setActiveCategory}
              leading={
                <button
                  type="button"
                  onClick={() => {}}
                  className="shrink-0 flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium leading-[18px] border border-neutral-600 text-neutral-800 font-[family-name:var(--font-inter)] cursor-pointer"
                >
                  <Search size={14} className="text-neutral-800" />
                  Search
                </button>
              }
            />

            <div className="flex flex-col gap-3 px-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="font-[family-name:var(--font-inter)] text-sm text-neutral-500">
                    Loading campaigns...
                  </span>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <span className="font-[family-name:var(--font-inter)] text-sm text-neutral-500">
                    No campaigns found.
                  </span>
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <DonationCard
                    key={campaign.id}
                    campaign={campaign}
                    onClick={(id) => router.push(`/donation/${id}`)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </MobilePageLayout>
  );
}
