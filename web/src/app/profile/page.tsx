"use client";

import { useState, useEffect, useCallback } from "react";
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

interface Profile {
  id: string;
  name: string;
  email: string;
  nim: string;
  yearOfEntry: number;
  phone: string;
  role: string;
  emailVerified: boolean;
  profileImageUrl: string | null;
  profileImageSignedUrl: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        return;
      }
      const { data } = await res.json();
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePhotoUploaded = () => {
    setPhotoSheetOpen(false);
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <p className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-500">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <p className="font-[family-name:var(--font-work-sans)] text-sm text-red-500">
          Failed to load profile.
        </p>
      </div>
    );
  }

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
            name={profile.name}
            imageUrl={profile.profileImageSignedUrl}
            onEditPhoto={() => setPhotoSheetOpen(true)}
          />
          <div className="flex flex-col items-center gap-1">
            <h2 className="font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
              {profile.name}
            </h2>
            <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500 text-center px-8">
              {profile.nim}
            </p>
          </div>
          {profile.emailVerified && (
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
          yearOfEntry={profile.yearOfEntry}
          jobPosted={0}
          totalDonated="Rp0"
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
                {profile.email}
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-work-sans)] text-xs text-neutral-500">
                Phone Number
              </p>
              <p className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-neutral-900">
                {profile.phone}
              </p>
            </div>
          </div>
          <div className="h-px bg-neutral-100 mt-4" />
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
        onPhotoUploaded={handlePhotoUploaded}
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
