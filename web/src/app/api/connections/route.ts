import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, ilike, desc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { users, careerHistory } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const yearOfEntry = searchParams.get("yearOfEntry");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(users.name, searchPattern),
          ilike(users.nim, searchPattern),
          sql`${users.id} IN (SELECT ${careerHistory.userId} FROM ${careerHistory} WHERE ${ilike(careerHistory.company, searchPattern)})`
        )
      );
    }

    if (yearOfEntry) {
      const year = parseInt(yearOfEntry, 10);
      if (!isNaN(year)) {
        conditions.push(eq(users.yearOfEntry, year));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Run count and data queries in parallel
    const [countResult, alumniRows] = await Promise.all([
      db.select({ value: count() }).from(users).where(whereClause),
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          nim: users.nim,
          yearOfEntry: users.yearOfEntry,
          phone: users.phone,
          profileImageUrl: users.profileImageUrl,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
    ]);
    const total = countResult[0]?.value ?? 0;

    // For each user, get current career info
    const userIds = alumniRows.map((u) => u.id);

    const careerMap: Record<string, { position: string; company: string }> = {};

    if (userIds.length > 0) {
      try {
        // Get current career (isCurrent=true) or latest by startYear
        const careers = await db
          .select({
            userId: careerHistory.userId,
            position: careerHistory.position,
            company: careerHistory.company,
            isCurrent: careerHistory.isCurrent,
            startYear: careerHistory.startYear,
          })
          .from(careerHistory)
          .where(
            sql`${careerHistory.userId} IN ${userIds}`
          )
          .orderBy(desc(careerHistory.isCurrent), desc(careerHistory.startYear));

        // Pick first (best) career per user
        for (const c of careers) {
          if (!careerMap[c.userId]) {
            careerMap[c.userId] = { position: c.position, company: c.company };
          }
        }
      } catch {
        // career_history table may not exist yet; gracefully continue
      }
    }

    const alumni = alumniRows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      nim: u.nim,
      yearOfEntry: u.yearOfEntry,
      phone: u.phone,
      profileImageUrl: u.profileImageUrl,
      isVerified: u.emailVerified,
      currentPosition: careerMap[u.id]?.position ?? null,
      currentCompany: careerMap[u.id]?.company ?? null,
    }));

    return NextResponse.json({ data: alumni, total });
  } catch (error) {
    console.error("Connections list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
