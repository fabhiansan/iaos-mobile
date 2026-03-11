import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationReportTestimonies } from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();

    if (!body.quote || !body.name) {
      return NextResponse.json({ error: "Quote and name are required" }, { status: 400 });
    }

    const [row] = await db
      .insert(donationReportTestimonies)
      .values({
        campaignId,
        quote: body.quote,
        name: body.name,
        year: body.year || null,
      })
      .returning();

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/donations/[id]/report-testimonies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
