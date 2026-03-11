import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { jobsWithPosterQuery } from "@/lib/job-queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [row] = await jobsWithPosterQuery()
      .where(eq(jobs.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error("GET /api/admin/jobs/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status !== "published" && status !== "draft") {
      return NextResponse.json(
        { error: "Invalid status. Must be 'published' or 'draft'." },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(jobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/admin/jobs/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await db.delete(jobs).where(eq(jobs.id, id));

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/admin/jobs/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
