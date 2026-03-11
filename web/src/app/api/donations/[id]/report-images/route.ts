import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationReportImages } from "@/db/schema";
import { getS3Key, uploadToS3, getSignedDownloadUrl } from "@/lib/s3";

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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = getS3Key(`donations/${campaignId}/report`, file.name);
    await uploadToS3(key, buffer, file.type);

    const [row] = await db
      .insert(donationReportImages)
      .values({ campaignId, imageKey: key })
      .returning();

    const url = await getSignedDownloadUrl(key);

    return NextResponse.json({ data: { id: row.id, url } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/donations/[id]/report-images error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
