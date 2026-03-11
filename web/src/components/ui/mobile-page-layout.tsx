"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, Search, type LucideIcon } from "lucide-react";
import { SideDrawer } from "@/components/news/side-drawer";
import { LogoutModal } from "@/components/news/logout-modal";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";

/* ------------------------------------------------------------------ */
/*  MobilePageHeader                                                   */
/* ------------------------------------------------------------------ */

interface MobilePageHeaderProps {
  title: string;
  onMenuOpen: () => void;
  rightActions?: ReactNode;
}

export function MobilePageHeader({
  title,
  onMenuOpen,
  rightActions,
}: MobilePageHeaderProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 h-11">
      <button type="button" onClick={onMenuOpen} className="shrink-0 cursor-pointer">
        <Menu size={16} className="text-neutral-900" />
      </button>
      <h1 className="flex-1 font-[family-name:var(--font-work-sans)] text-xl font-semibold text-neutral-900">
        {title}
      </h1>
      {rightActions && (
        <div className="flex items-center gap-4">
          {rightActions}
        </div>
      )}
      {/* Spacer when no right actions to keep title left-aligned consistently */}
      {!rightActions && <div className="w-4 shrink-0" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileHeaderAction (icon button for header right side)             */
/* ------------------------------------------------------------------ */

interface MobileHeaderActionProps {
  icon: LucideIcon;
  onClick: () => void;
  badge?: boolean;
}

export function MobileHeaderAction({ icon: Icon, onClick, badge }: MobileHeaderActionProps) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 relative cursor-pointer">
      <Icon size={16} className="text-neutral-900" />
      {badge && (
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileSearchBar                                                    */
/* ------------------------------------------------------------------ */

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MobileSearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: MobileSearchBarProps) {
  return (
    <div className="px-4">
      <div className="relative flex items-center h-14 bg-neutral-50 border border-brand-200 rounded-lg px-3">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent font-[family-name:var(--font-work-sans)] text-sm text-neutral-800 outline-none placeholder:text-neutral-500"
        />
        <Search size={20} className="text-neutral-400 shrink-0 ml-2" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileFilterChips                                                  */
/* ------------------------------------------------------------------ */

interface MobileFilterChipsProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** Optional leading element before the chips (e.g. Sort button, Search button) */
  leading?: ReactNode;
}

export function MobileFilterChips({
  options,
  value,
  onChange,
  leading,
}: MobileFilterChipsProps) {
  return (
    <div className="flex items-center gap-2 px-4">
      {leading && (
        <>
          {leading}
          <div className="w-px h-8 bg-neutral-200 shrink-0" />
        </>
      )}
      <div className="flex flex-1 gap-1 items-center overflow-x-auto no-scrollbar">
        {options.map((opt) => {
          const isActive = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`shrink-0 px-2 py-2 rounded-lg text-xs font-medium leading-[18px] border cursor-pointer transition-colors ${
                isActive
                  ? "bg-brand-800 border-brand-500 text-brand-50 font-[family-name:var(--font-work-sans)]"
                  : "bg-transparent border-neutral-600 text-neutral-800 font-[family-name:var(--font-inter)]"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MobilePageLayout                                                   */
/* ------------------------------------------------------------------ */

interface MobilePageLayoutProps {
  /** The active navigation item for the side drawer */
  activeItem: string;
  children: (props: { onMenuOpen: () => void }) => ReactNode;
}

export function MobilePageLayout({
  activeItem,
  children,
}: MobilePageLayoutProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleMenuOpen = () => setDrawerOpen(true);

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
        {children({ onMenuOpen: handleMenuOpen })}
      </div>

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem={activeItem}
        onNavigate={(item) => {
          setDrawerOpen(false);
          if (item !== activeItem) router.push(`/${item}`);
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

      <BottomTabBar />
    </div>
  );
}
