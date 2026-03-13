export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow the root splash/login page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Check auth
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // Profile completion gate — redirect incomplete profiles
  if (req.auth.user?.profileComplete === false && pathname !== "/complete-profile") {
    const completeProfileUrl = new URL("/complete-profile", req.nextUrl.origin);
    return NextResponse.redirect(completeProfileUrl);
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
