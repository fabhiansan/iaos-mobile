import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationCampaigns, donationTransactions } from "@/db/schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: campaignId, txId } = await params;
    const body = await request.json();
    const { status } = body;

    if (status !== "verified" && status !== "rejected") {
      return NextResponse.json(
        { error: "Status must be 'verified' or 'rejected'" },
        { status: 400 }
      );
    }

    // Get current transaction
    const [transaction] = await db
      .select()
      .from(donationTransactions)
      .where(
        and(
          eq(donationTransactions.id, txId),
          eq(donationTransactions.campaignId, campaignId)
        )
      );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const previousStatus = transaction.status;

    // Update transaction
    const [updated] = await db
      .update(donationTransactions)
      .set({
        status,
        verifiedAt: status === "verified" ? new Date() : null,
      })
      .where(eq(donationTransactions.id, txId))
      .returning();

    // Adjust campaign currentAmount
    if (status === "verified" && previousStatus !== "verified") {
      // Add amount to campaign
      await db
        .update(donationCampaigns)
        .set({
          currentAmount: sql`${donationCampaigns.currentAmount} + ${transaction.amount}`,
        })
        .where(eq(donationCampaigns.id, campaignId));
    } else if (status === "rejected" && previousStatus === "verified") {
      // Subtract amount from campaign
      await db
        .update(donationCampaigns)
        .set({
          currentAmount: sql`${donationCampaigns.currentAmount} - ${transaction.amount}`,
        })
        .where(eq(donationCampaigns.id, campaignId));
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/donations/[id]/transactions/[txId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
