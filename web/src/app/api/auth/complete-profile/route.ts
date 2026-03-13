import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth, unstable_update } from "@/lib/auth";
import { completeProfileSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = completeProfileSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { nim, yearOfEntry, phone } = result.data;

    // Check NIM uniqueness
    const [existingNim] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.nim, nim))
      .limit(1);

    if (existingNim && existingNim.id !== session.user.id) {
      return NextResponse.json(
        { error: "Student ID already registered" },
        { status: 409 }
      );
    }

    // Update user profile
    await db
      .update(users)
      .set({
        nim,
        yearOfEntry,
        phone,
        profileComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    await unstable_update({
      ...session,
      user: {
        ...session.user,
        profileComplete: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
