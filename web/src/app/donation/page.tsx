"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DonationHeader } from "@/components/donation/donation-header";
import { DonationChips } from "@/components/donation/donation-chips";
import { DonationCard } from "@/components/donation/donation-card";
import { SideDrawer } from "@/components/news/side-drawer";
import { LogoutModal } from "@/components/news/logout-modal";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import type { DonationCampaign } from "@/components/donation/donation-card";

const CATEGORIES = ["All Donations", "Scholarship", "Events"];

const CAMPAIGNS: DonationCampaign[] = [
  {
    id: "1",
    title: "Educational Support Program for the Children of Alumni",
    description:
      "Educational financial assistance for the children of alumni as a commitment to supporting educational c...",
    category: "Scholarship",
    imageUrl: "/images/donation-placeholder-1.jpg",
    currentAmount: 45000000,
    targetAmount: 60000000,
  },
  {
    id: "2",
    title: "Annual Gathering Reunion 2026",
    description:
      "Financial support for the Grand Alumni Reunion of Oseanografi ITB, a vibrant gathering designed to reco...",
    category: "Events",
    imageUrl: "/images/donation-placeholder-2.jpg",
    currentAmount: 12500000,
    targetAmount: 80000000,
  },
  {
    id: "3",
    title: "Marine Research Equipment Fund",
    description:
      "Funding for advanced marine research equipment to support oceanographic studies and field expeditions...",
    category: "Scholarship",
    imageUrl: "/images/donation-placeholder-3.jpg",
    currentAmount: 8000000,
    targetAmount: 50000000,
  },
];

export default function DonationPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All Donations");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const filteredCampaigns =
    activeCategory === "All Donations"
      ? CAMPAIGNS
      : CAMPAIGNS.filter((c) => c.category === activeCategory);

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
            {filteredCampaigns.map((campaign) => (
              <DonationCard
                key={campaign.id}
                campaign={campaign}
                onClick={(id) => router.push(`/donation/${id}`)}
              />
            ))}
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
        onConfirm={() => {
          setLogoutOpen(false);
          router.push("/login");
        }}
      />

      <BottomTabBar activeTab="donation" />
    </div>
  );
}
