import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSignedDownloadUrl } from "@/lib/s3";

const profileColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  nim: users.nim,
  yearOfEntry: users.yearOfEntry,
  phone: users.phone,
  role: users.role,
  emailVerified: users.emailVerified,
  profileImageUrl: users.profileImageUrl,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [user] = await db
      .select(profileColumns)
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let profileImageSignedUrl: string | null = null;
    if (user.profileImageUrl) {
      try {
        profileImageSignedUrl = await getSignedDownloadUrl(user.profileImageUrl);
      } catch {
        // If signing fails, leave as null
      }
    }

    return NextResponse.json({
      data: { ...user, profileImageSignedUrl },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, yearOfEntry } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.trim().length === 0) {
        return NextResponse.json(
          { error: "Phone must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.phone = phone.trim();
    }

    if (yearOfEntry !== undefined) {
      const year = Number(yearOfEntry);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return NextResponse.json(
          { error: "Year of entry must be a valid year" },
          { status: 400 }
        );
      }
      updateData.yearOfEntry = year;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    const [updatedUser] = await db
      .select(profileColumns)
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
