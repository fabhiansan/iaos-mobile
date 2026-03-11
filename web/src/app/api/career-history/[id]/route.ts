import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { careerHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [entry] = await db
      .select()
      .from(careerHistory)
      .where(
        and(eq(careerHistory.id, id), eq(careerHistory.userId, session.user.id))
      )
      .limit(1);

    if (!entry) {
      return NextResponse.json(
        { error: "Career entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: entry });
  } catch (error) {
    console.error("Failed to fetch career entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(careerHistory)
      .where(
        and(eq(careerHistory.id, id), eq(careerHistory.userId, session.user.id))
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Career entry not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { position, company, startYear, endYear, isCurrent } = body;

    const [updated] = await db
      .update(careerHistory)
      .set({
        position: position ?? existing.position,
        company: company ?? existing.company,
        startYear: startYear != null ? Number(startYear) : existing.startYear,
        endYear: isCurrent
          ? null
          : endYear != null
            ? Number(endYear)
            : existing.endYear,
        isCurrent: isCurrent != null ? Boolean(isCurrent) : existing.isCurrent,
        updatedAt: new Date(),
      })
      .where(
        and(eq(careerHistory.id, id), eq(careerHistory.userId, session.user.id))
      )
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update career entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [deleted] = await db
      .delete(careerHistory)
      .where(
        and(eq(careerHistory.id, id), eq(careerHistory.userId, session.user.id))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Career entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Failed to delete career entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
