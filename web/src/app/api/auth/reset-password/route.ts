import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { validatePassword } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
        { status: 400 }
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.resetToken, hashedToken),
          gt(users.resetTokenExpires, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
