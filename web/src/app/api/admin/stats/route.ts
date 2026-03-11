import { NextResponse } from "next/server";
import { count, eq, sum } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  articles,
  jobs,
  donationCampaigns,
  donationTransactions,
} from "@/db/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      [{ value: totalUsers }],
      [{ value: totalArticles }],
      [{ value: totalJobs }],
      [{ value: totalCampaigns }],
      [{ value: totalPending }],
      [{ value: totalDonated }],
      [{ value: totalPendingJobs }],
    ] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(articles),
      db.select({ value: count() }).from(jobs).where(eq(jobs.status, "published")),
      db.select({ value: count() }).from(donationCampaigns),
      db
        .select({ value: count() })
        .from(donationTransactions)
        .where(eq(donationTransactions.status, "pending")),
      db
        .select({ value: sum(donationTransactions.amount) })
        .from(donationTransactions)
        .where(eq(donationTransactions.status, "verified")),
      db.select({ value: count() }).from(jobs).where(eq(jobs.status, "pending_review")),
    ]);

    return NextResponse.json({
      data: {
        users: totalUsers,
        articles: totalArticles,
        jobs: totalJobs,
        campaigns: totalCampaigns,
        pendingTransactions: totalPending,
        totalDonated: Number(totalDonated) || 0,
        pendingJobs: totalPendingJobs,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
