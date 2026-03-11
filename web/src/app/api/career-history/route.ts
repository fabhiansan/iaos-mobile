import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { careerHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const careers = await db
      .select()
      .from(careerHistory)
      .where(eq(careerHistory.userId, session.user.id))
      .orderBy(desc(careerHistory.startYear));

    return NextResponse.json({ data: careers });
  } catch (error) {
    console.error("Failed to fetch career history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { position, company, startYear, endYear, isCurrent } = body;

    if (!position || !company || startYear == null) {
      return NextResponse.json(
        { error: "Position, company, and startYear are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(careerHistory)
      .values({
        userId: session.user.id,
        position,
        company,
        startYear: Number(startYear),
        endYear: isCurrent ? null : endYear != null ? Number(endYear) : null,
        isCurrent: Boolean(isCurrent),
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create career entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
