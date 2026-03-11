/** Check if an admin nav path is active given the current pathname. */
export function isAdminPathActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export const adminPageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/news": "News Management",
  "/admin/jobs": "Jobs Management",
  "/admin/donations": "Donations Management",
  "/admin/users": "Users Management",
};
