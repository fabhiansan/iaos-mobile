import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationTransactions, users } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    const transactions = await db
      .select({
        id: donationTransactions.id,
        amount: donationTransactions.amount,
        status: donationTransactions.status,
        proofImageUrl: donationTransactions.proofImageUrl,
        createdAt: donationTransactions.createdAt,
        verifiedAt: donationTransactions.verifiedAt,
        donorName: users.name,
        donorYearOfEntry: users.yearOfEntry,
      })
      .from(donationTransactions)
      .innerJoin(users, eq(donationTransactions.donorId, users.id))
      .where(eq(donationTransactions.campaignId, campaignId))
      .orderBy(desc(donationTransactions.createdAt));

    return NextResponse.json({ data: transactions });
  } catch (error) {
    console.error("GET /api/donations/[id]/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
