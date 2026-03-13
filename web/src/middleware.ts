export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route)) || pathname === "/";

  // Unauthenticated users: allow public routes, redirect everything else to login
  if (!req.auth) {
    if (isPublicRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // --- Authenticated users below ---

  // Profile completion gate — JWT can be stale, so verify against DB
  if (req.auth.user?.profileComplete === false && pathname !== "/complete-profile") {
    const [dbUser] = await db
      .select({ profileComplete: users.profileComplete })
      .from(users)
      .where(eq(users.id, req.auth.user.id))
      .limit(1);

    if (!dbUser?.profileComplete) {
      return NextResponse.redirect(new URL("/complete-profile", req.nextUrl.origin));
    }
    // DB says profile is complete — JWT was stale, let the request through
  }

  // Redirect authenticated users away from public/auth pages to news
  if (isPublicRoute) {
    return NextResponse.redirect(new URL("/news", req.nextUrl.origin));
  }

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    if (req.auth.user?.role !== "admin") {
      const newsUrl = new URL("/news", req.nextUrl.origin);
      return NextResponse.redirect(newsUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
