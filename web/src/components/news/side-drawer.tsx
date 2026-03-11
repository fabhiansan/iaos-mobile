"use client";

import { X, Newspaper, Users, Briefcase, Heart, User, LogOut } from "lucide-react";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: string;
  onNavigate: (item: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: "news", label: "News", icon: Newspaper },
  { id: "connection", label: "Connection", icon: Users },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "donation", label: "Donation", icon: Heart },
];

const bottomItems = [
  { id: "profile", label: "Profile", icon: User },
];

export function SideDrawer({
  isOpen,
  onClose,
  activeItem = "news",
  onNavigate,
  onLogout,
}: SideDrawerProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[277px] bg-brand-50 z-50 flex flex-col gap-6 px-3 py-12 rounded-r-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-4 px-2">
          <h2 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
            IAOS Connect Menu
          </h2>
          <button type="button" onClick={onClose} className="cursor-pointer">
            <X size={12} className="text-neutral-900" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeItem;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                  isActive ? "bg-brand-100" : ""
                }`}
              >
                <Icon size={24} className={isActive ? "text-brand-800" : "text-neutral-800"} />
                <span
                  className={`font-[family-name:var(--font-work-sans)] text-base font-medium ${
                    isActive ? "text-brand-800" : "text-neutral-800"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="h-px bg-neutral-300" />

        <div className="flex flex-col gap-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer"
              >
                <Icon size={24} className="text-neutral-800" />
                <span className="font-[family-name:var(--font-work-sans)] text-base font-medium text-neutral-800">
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer"
          >
            <LogOut size={20} className="text-red-500" />
            <span className="font-[family-name:var(--font-work-sans)] text-base font-medium text-red-500">
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
