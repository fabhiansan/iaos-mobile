import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationCampaigns, donationTransactions } from "@/db/schema";
import { getS3Key, uploadToS3 } from "@/lib/s3";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Verify campaign exists
    const [campaign] = await db
      .select({ id: donationCampaigns.id })
      .from(donationCampaigns)
      .where(eq(donationCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const amountStr = formData.get("amount") as string | null;

    if (!file || !amountStr) {
      return NextResponse.json({ error: "File and amount are required" }, { status: 400 });
    }

    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = getS3Key(`donations/${campaignId}/proofs`, file.name);
    await uploadToS3(key, buffer, file.type);

    const [transaction] = await db
      .insert(donationTransactions)
      .values({
        campaignId,
        donorId: session.user.id,
        amount,
        proofImageUrl: key,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/donations/[id]/upload-proof error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
