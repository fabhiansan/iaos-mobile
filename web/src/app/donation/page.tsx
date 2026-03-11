"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { DonationHeader } from "@/components/donation/donation-header";
import { DonationChips } from "@/components/donation/donation-chips";
import { DonationCard } from "@/components/donation/donation-card";
import { SideDrawer } from "@/components/news/side-drawer";
import { LogoutModal } from "@/components/news/logout-modal";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
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
        <DonationHeader
          onMenuOpen={() => setDrawerOpen(true)}
          onLeaderboardOpen={() => router.push("/donation/leaderboard")}
        />

        <div className="flex flex-col gap-6 pt-2 pb-24">
          <DonationChips
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onSearchOpen={() => {}}
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
      </div>

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="donation"
        onNavigate={(item) => {
          setDrawerOpen(false);
          if (item !== "donation") router.push(`/${item}`);
        }}
        onLogout={() => {
          setDrawerOpen(false);
          setLogoutOpen(true);
        }}
      />

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await signOut({ callbackUrl: "/login" });
        }}
      />

      <BottomTabBar activeTab="donation" />
    </div>
  );
}
