"use client";

import { Newspaper, Users, Briefcase, Heart, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const tabs = [
  { id: "news", label: "News", icon: Newspaper, path: "/news" },
  { id: "connection", label: "Connection", icon: Users, path: "/connection" },
  { id: "career", label: "Career", icon: Briefcase, path: "/career" },
  { id: "donation", label: "Donation", icon: Heart, path: "/donation" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

interface BottomTabBarProps {
  activeTab?: string;
}

export function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab =
    activeTab ?? tabs.find((tab) => pathname.startsWith(tab.path))?.id ?? "news";

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-neutral-100 z-30">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => router.push(tab.path)}
              className="flex flex-col items-center gap-1 px-2 py-1 cursor-pointer"
            >
              <Icon size={24} className={isActive ? "text-brand-600" : "text-neutral-500"} />
              <span
                className={`font-[family-name:var(--font-work-sans)] text-[10px] font-medium ${
                  isActive ? "text-brand-600" : "text-neutral-500"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
