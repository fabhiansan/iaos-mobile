"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { adminPageTitles, isAdminPathActive } from "@/lib/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const title =
    Object.entries(adminPageTitles).find(([path]) =>
      isAdminPathActive(path, pathname)
    )?.[1] ?? "Admin";

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 bg-neutral-50 min-h-screen">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
          <h2 className="font-[family-name:var(--font-work-sans)] text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          {session?.user && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span>{session.user.name}</span>
              <span className="rounded bg-brand-600 px-1.5 py-0.5 text-xs text-white">
                {session.user.role}
              </span>
            </div>
          )}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
