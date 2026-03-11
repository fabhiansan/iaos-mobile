import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationCampaigns, donationTransactions, users } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [campaign] = await db
      .select({
        id: donationCampaigns.id,
        title: donationCampaigns.title,
        description: donationCampaigns.description,
        category: donationCampaigns.category,
        imageUrl: donationCampaigns.imageUrl,
        targetAmount: donationCampaigns.targetAmount,
        currentAmount: donationCampaigns.currentAmount,
        accountNumber: donationCampaigns.accountNumber,
        bankName: donationCampaigns.bankName,
        accountName: donationCampaigns.accountName,
        donationInstructions: donationCampaigns.donationInstructions,
        beneficiaryCount: donationCampaigns.beneficiaryCount,
        createdAt: donationCampaigns.createdAt,
        totalRaised: sql<number>`coalesce(sum(case when ${donationTransactions.status} = 'verified' then ${donationTransactions.amount} else 0 end), 0)`.as("total_raised"),
        donorCount: sql<number>`count(distinct case when ${donationTransactions.status} = 'verified' then ${donationTransactions.donorId} end)`.as("donor_count"),
      })
      .from(donationCampaigns)
      .leftJoin(donationTransactions, eq(donationCampaigns.id, donationTransactions.campaignId))
      .where(eq(donationCampaigns.id, id))
      .groupBy(donationCampaigns.id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const recentTransactions = await db
      .select({
        id: donationTransactions.id,
        amount: donationTransactions.amount,
        status: donationTransactions.status,
        createdAt: donationTransactions.createdAt,
        donorName: users.name,
        donorYearOfEntry: users.yearOfEntry,
      })
      .from(donationTransactions)
      .innerJoin(users, eq(donationTransactions.donorId, users.id))
      .where(eq(donationTransactions.campaignId, id))
      .orderBy(desc(donationTransactions.createdAt))
      .limit(20);

    return NextResponse.json({ data: { ...campaign, recentTransactions } });
  } catch (error) {
    console.error("GET /api/donations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
