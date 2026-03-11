import { NextResponse } from "next/server";
import { eq, and, sql, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { jobs } from "@/db/schema";
import { jobsWithPosterQuery } from "@/lib/job-queries";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await jobsWithPosterQuery()
      .where(
        and(
          eq(jobs.postedById, session.user.id),
          inArray(jobs.status, ["draft", "pending_review"])
        )
      )
      .orderBy(sql`${jobs.updatedAt} DESC`);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET /api/jobs/drafts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
