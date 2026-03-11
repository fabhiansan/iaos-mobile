import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { uploadToS3, deleteFromS3, getS3Key } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File must be an image (JPEG, PNG, WebP, or GIF)" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Delete old photo from S3 if exists
    const [currentUser] = await db
      .select({ profileImageUrl: users.profileImageUrl })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (currentUser?.profileImageUrl) {
      try {
        await deleteFromS3(currentUser.profileImageUrl);
      } catch {
        // Ignore delete errors for old file
      }
    }

    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = getS3Key(
      `profiles/${session.user.id}`,
      `${timestamp}-${sanitizedFilename}`
    );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadToS3(key, buffer, file.type);

    await db
      .update(users)
      .set({
        profileImageUrl: key,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ data: { profileImageUrl: key } });
  } catch (error) {
    console.error("Upload profile photo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [currentUser] = await db
      .select({ profileImageUrl: users.profileImageUrl })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (currentUser?.profileImageUrl) {
      try {
        await deleteFromS3(currentUser.profileImageUrl);
      } catch {
        // Ignore delete errors
      }
    }

    await db
      .update(users)
      .set({
        profileImageUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ data: { profileImageUrl: null } });
  } catch (error) {
    console.error("Delete profile photo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
