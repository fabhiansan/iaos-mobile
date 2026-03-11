"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Newspaper,
  Briefcase,
  Heart,
  Users,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { isAdminPathActive } from "@/lib/admin-nav";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/donations", label: "Donations", icon: Heart },
  { href: "/admin/users", label: "Users", icon: Users },
];

const linkBase =
  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors";
const linkIdle = "text-white/80 hover:bg-brand-700 hover:text-white";
const linkActive = "bg-brand-700 text-white";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col bg-brand-800 text-white min-h-screen">
      <div className="p-4">
        <h1 className="font-[family-name:var(--font-work-sans)] text-lg font-bold tracking-tight">
          IAOS Admin
        </h1>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${linkBase} ${isAdminPathActive(href, pathname) ? linkActive : linkIdle}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-white/10 p-2">
        <Link href="/news" className={`${linkBase} ${linkIdle}`}>
          <ArrowLeft size={18} />
          Back to App
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`${linkBase} ${linkIdle} text-left`}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
