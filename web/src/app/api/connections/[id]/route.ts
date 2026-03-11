import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, careerHistory } from "@/db/schema";
import { auth } from "@/lib/auth";

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

    const [user] = await db
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
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let careers: {
      id: string;
      position: string;
      company: string;
      startYear: number;
      endYear: number | null;
      isCurrent: boolean;
    }[] = [];

    try {
      careers = await db
        .select({
          id: careerHistory.id,
          position: careerHistory.position,
          company: careerHistory.company,
          startYear: careerHistory.startYear,
          endYear: careerHistory.endYear,
          isCurrent: careerHistory.isCurrent,
        })
        .from(careerHistory)
        .where(eq(careerHistory.userId, id))
        .orderBy(desc(careerHistory.startYear));
    } catch {
      // career_history table may not exist yet; return empty array
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        nim: user.nim,
        yearOfEntry: user.yearOfEntry,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        isVerified: user.emailVerified,
        careers,
      },
    });
  } catch (error) {
    console.error("Connection detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
