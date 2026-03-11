import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationReportTestimonies } from "@/db/schema";

type RouteContext = { params: Promise<{ id: string; testimonyId: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: campaignId, testimonyId } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(donationReportTestimonies)
      .set({
        ...(body.quote !== undefined && { quote: body.quote }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.year !== undefined && { year: body.year || null }),
      })
      .where(
        and(
          eq(donationReportTestimonies.id, testimonyId),
          eq(donationReportTestimonies.campaignId, campaignId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Testimony not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/donations/[id]/report-testimonies/[testimonyId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: campaignId, testimonyId } = await params;

    const [deleted] = await db
      .delete(donationReportTestimonies)
      .where(
        and(
          eq(donationReportTestimonies.id, testimonyId),
          eq(donationReportTestimonies.campaignId, campaignId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Testimony not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/donations/[id]/report-testimonies/[testimonyId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
