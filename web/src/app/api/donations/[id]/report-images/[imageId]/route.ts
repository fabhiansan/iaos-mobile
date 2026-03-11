import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationReportImages } from "@/db/schema";
import { deleteFromS3 } from "@/lib/s3";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: campaignId, imageId } = await params;

    const [deleted] = await db
      .delete(donationReportImages)
      .where(
        and(
          eq(donationReportImages.id, imageId),
          eq(donationReportImages.campaignId, campaignId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await deleteFromS3(deleted.imageKey);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/donations/[id]/report-images/[imageId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
