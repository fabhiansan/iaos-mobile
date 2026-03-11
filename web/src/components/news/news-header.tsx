"use client";

import { Menu, Search, Bell } from "lucide-react";

interface NewsHeaderProps {
  onMenuOpen: () => void;
  onSearchOpen: () => void;
  onNotificationsOpen: () => void;
  hasUnread?: boolean;
}

export function NewsHeader({
  onMenuOpen,
  onSearchOpen,
  onNotificationsOpen,
  hasUnread = false,
}: NewsHeaderProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 h-11">
      <button type="button" onClick={onMenuOpen} className="shrink-0 cursor-pointer">
        <Menu size={16} className="text-neutral-900" />
      </button>
      <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
        Tidal News
      </h1>
      <button type="button" onClick={onSearchOpen} className="shrink-0 cursor-pointer">
        <Search size={16} className="text-neutral-900" />
      </button>
      <button
        type="button"
        onClick={onNotificationsOpen}
        className="shrink-0 relative cursor-pointer"
      >
        <Bell size={16} className="text-neutral-900" />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        )}
      </button>
    </div>
  );
}
