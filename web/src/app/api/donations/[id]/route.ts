import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationCampaigns, donationTransactions, users } from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
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

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
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

    const [updated] = await db
      .update(donationCampaigns)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.targetAmount !== undefined && { targetAmount: body.targetAmount }),
        ...(body.accountNumber !== undefined && { accountNumber: body.accountNumber }),
        ...(body.bankName !== undefined && { bankName: body.bankName }),
        ...(body.accountName !== undefined && { accountName: body.accountName }),
        ...(body.donationInstructions !== undefined && { donationInstructions: body.donationInstructions }),
        ...(body.beneficiaryCount !== undefined && { beneficiaryCount: body.beneficiaryCount }),
        updatedAt: new Date(),
      })
      .where(eq(donationCampaigns.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/donations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
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

    // Delete associated transactions first
    await db
      .delete(donationTransactions)
      .where(eq(donationTransactions.campaignId, id));

    const [deleted] = await db
      .delete(donationCampaigns)
      .where(eq(donationCampaigns.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/donations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
