import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { nim, yearOfEntry, phone } = await request.json();

    // Validate required fields
    if (!nim || !yearOfEntry || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate NIM (alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(nim)) {
      return NextResponse.json(
        { error: "Student ID must be alphanumeric" },
        { status: 400 }
      );
    }

    // Validate phone (digits only)
    if (!/^\d+$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone number must contain only digits" },
        { status: 400 }
      );
    }

    // Validate year of entry
    const currentYear = new Date().getFullYear();
    if (yearOfEntry < 1950 || yearOfEntry > currentYear) {
      return NextResponse.json(
        { error: "Invalid year of entry" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
