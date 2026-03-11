import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { jobsWithPosterQuery } from "@/lib/job-queries";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(jobs.title, `%${search}%`),
          ilike(jobs.company, `%${search}%`)
        )!
      );
    }

    if (status === "draft" || status === "published" || status === "pending_review") {
      conditions.push(eq(jobs.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, rows] = await Promise.all([
      db.select({ count: count() }).from(jobs).where(where),
      jobsWithPosterQuery()
        .where(where)
        .orderBy(desc(jobs.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return NextResponse.json({ data: rows, total: totalResult[0].count });
  } catch (error) {
    console.error("GET /api/admin/jobs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
