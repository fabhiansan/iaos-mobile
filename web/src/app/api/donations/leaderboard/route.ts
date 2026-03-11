import { NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { donationTransactions, users } from "@/db/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // By year of entry: group verified transactions by donor's yearOfEntry
    const byYearOfEntry = await db
      .select({
        yearOfEntry: users.yearOfEntry,
        totalAmount: sql<number>`sum(${donationTransactions.amount})`.as("total_amount"),
        donorCount: sql<number>`count(distinct ${donationTransactions.donorId})`.as("donor_count"),
      })
      .from(donationTransactions)
      .innerJoin(users, eq(donationTransactions.donorId, users.id))
      .where(eq(donationTransactions.status, "verified"))
      .groupBy(users.yearOfEntry)
      .orderBy(desc(sql`sum(${donationTransactions.amount})`));

    // By individual: group verified transactions by donorId
    const byIndividual = await db
      .select({
        donorId: donationTransactions.donorId,
        donorName: users.name,
        yearOfEntry: users.yearOfEntry,
        totalAmount: sql<number>`sum(${donationTransactions.amount})`.as("total_amount"),
      })
      .from(donationTransactions)
      .innerJoin(users, eq(donationTransactions.donorId, users.id))
      .where(eq(donationTransactions.status, "verified"))
      .groupBy(donationTransactions.donorId, users.name, users.yearOfEntry)
      .orderBy(desc(sql`sum(${donationTransactions.amount})`));

    return NextResponse.json({
      data: {
        byYearOfEntry: byYearOfEntry.map((row, i) => ({
          rank: i + 1,
          name: String(row.yearOfEntry),
          amount: Number(row.totalAmount),
          donorCount: Number(row.donorCount),
        })),
        byIndividual: byIndividual.map((row, i) => ({
          rank: i + 1,
          name: row.donorName,
          year: String(row.yearOfEntry),
          amount: Number(row.totalAmount),
          initials: row.donorName
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase(),
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/donations/leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
