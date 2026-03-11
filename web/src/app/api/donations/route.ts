import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationCampaigns, donationTransactions } from "@/db/schema";
import { getSignedDownloadUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const campaigns = await db
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
        beneficiaryCount: donationCampaigns.beneficiaryCount,
        createdAt: donationCampaigns.createdAt,
        totalRaised: sql<number>`coalesce(sum(case when ${donationTransactions.status} = 'verified' then ${donationTransactions.amount} else 0 end), 0)`.as("total_raised"),
        donorCount: sql<number>`count(distinct case when ${donationTransactions.status} = 'verified' then ${donationTransactions.donorId} end)`.as("donor_count"),
      })
      .from(donationCampaigns)
      .leftJoin(donationTransactions, eq(donationCampaigns.id, donationTransactions.campaignId))
      .where(category && category !== "All Donations" ? eq(donationCampaigns.category, category as "Scholarship" | "Events") : undefined)
      .groupBy(donationCampaigns.id)
      .orderBy(desc(donationCampaigns.createdAt));

    const campaignsWithSignedUrls = await Promise.all(
      campaigns.map(async (item) => ({
        ...item,
        imageUrl: item.imageUrl ? await getSignedDownloadUrl(item.imageUrl) : null,
      }))
    );

    return NextResponse.json({ data: campaignsWithSignedUrls });
  } catch (error) {
    console.error("GET /api/donations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, imageUrl, targetAmount, accountNumber, bankName, accountName, donationInstructions, beneficiaryCount } = body;

    if (!title || !description || !category || !targetAmount || !accountNumber || !bankName || !accountName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [campaign] = await db
      .insert(donationCampaigns)
      .values({
        title,
        description,
        category,
        imageUrl: imageUrl || null,
        targetAmount,
        accountNumber,
        bankName,
        accountName,
        donationInstructions: donationInstructions || null,
        beneficiaryCount: beneficiaryCount || 0,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    console.error("POST /api/donations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
