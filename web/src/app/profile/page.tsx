"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, ChevronRight, LogOut, Check } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileStats } from "@/components/profile/profile-stats";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { ChangePhotoSheet } from "@/components/profile/change-photo-sheet";
import { SideDrawer } from "@/components/news/side-drawer";
import { LogoutModal } from "@/components/news/logout-modal";
import { Button } from "@/components/ui/button";

const PROFILE = {
  name: "Budi Santoso",
  title: "Chief Executive Officer at PT Eksekusi Teknologi Nusantara",
  verified: true,
  yearOfEntry: 2008,
  jobPosted: 5,
  totalDonated: "Rp600.000",
  email: "budsans@gmail.com",
  phone: "+62 812 8491 2857",
  careers: [
    {
      position: "Chief Executive Officer",
      company: "PT Eksekusi Teknologi Nusantara",
      period: "2020 - Recent",
    },
    {
      position: "Chief Marketing Officer",
      company: "PT Eksekusi Teknologi Nusantara",
      period: "2017 - 2020",
    },
    {
      position: "Head of Marketing",
      company: "PT Sarana Canggih Semesta",
      period: "2015 - 2017",
    },
    {
      position: "Marketing Staff",
      company: "PT Sarana Canggih Semesta",
      period: "2013 - 2015",
    },
  ],
};

export default function ProfilePage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

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

      <div className="relative z-10 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="cursor-pointer"
          >
            <Menu size={24} className="text-neutral-900" />
          </button>
          <h1 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
            Profile
          </h1>
          <div className="w-6" />
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3 pt-4 pb-6">
          <ProfileAvatar
            name={PROFILE.name}
            onEditPhoto={() => setPhotoSheetOpen(true)}
          />
          <div className="flex flex-col items-center gap-1">
            <h2 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
              {PROFILE.name}
            </h2>
            <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500 text-center px-8">
              {PROFILE.title}
            </p>
          </div>
          {PROFILE.verified && (
            <div className="flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-full">
              <Check size={14} className="text-green-500" />
              <span className="font-[family-name:var(--font-work-sans)] text-xs font-medium text-green-500">
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <ProfileStats
          yearOfEntry={PROFILE.yearOfEntry}
          jobPosted={PROFILE.jobPosted}
          totalDonated={PROFILE.totalDonated}
        />

        {/* Contact Information */}
        <div className="px-4 pt-6">
          <div className="border-l-2 border-brand-600 pl-3">
            <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-900">
              Contact Information
            </h3>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                Email
              </p>
              <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-900">
                {PROFILE.email}
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                Phone Number
              </p>
              <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-900">
                {PROFILE.phone}
              </p>
            </div>
          </div>
          <div className="h-px bg-neutral-100 mt-4" />
        </div>

        {/* Career Section */}
        <div className="px-4 pt-4">
          <div className="border-l-2 border-brand-600 pl-3">
            <h3 className="font-[family-name:var(--font-work-sans)] text-base font-semibold text-neutral-900">
              Career
            </h3>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {PROFILE.careers.map((career, index) => (
              <div key={index}>
                <p className="font-[family-name:var(--font-work-sans)] text-sm font-semibold text-neutral-900">
                  {career.position}
                </p>
                <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                  {career.company}
                </p>
                <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                  {career.period}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Career Button */}
        <div className="px-4 pt-6">
          <Button
            variant="secondary"
            onClick={() => router.push("/profile/career")}
          >
            Edit Career
          </Button>
        </div>

        {/* Profile Setting */}
        <div className="px-4 pt-6">
          <button
            type="button"
            onClick={() => router.push("/profile/edit")}
            className="w-full flex items-center justify-between py-2 cursor-pointer"
          >
            <span className="font-[family-name:var(--font-work-sans)] text-base font-medium text-neutral-900">
              Profile Setting
            </span>
            <ChevronRight size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Logout */}
        <div className="px-4 pt-2">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={20} className="text-red-500" />
            <span className="font-[family-name:var(--font-work-sans)] text-base font-medium text-red-500">
              Logout
            </span>
          </button>
        </div>
      </div>

      <BottomTabBar />

      <ChangePhotoSheet
        isOpen={photoSheetOpen}
        onClose={() => setPhotoSheetOpen(false)}
        onTakePhoto={() => setPhotoSheetOpen(false)}
        onChooseLibrary={() => setPhotoSheetOpen(false)}
      />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem="profile"
        onNavigate={(item) => {
          setDrawerOpen(false);
          if (item !== "profile") router.push(`/${item}`);
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
    </div>
  );
}
