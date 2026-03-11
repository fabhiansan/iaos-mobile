import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { validatePassword } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, nim, yearOfEntry, phone } = body;

    // Validate required fields
    if (!name || !email || !password || !nim || !yearOfEntry || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
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

    // Check if email or NIM already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.nim, nim)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Email or Student ID already registered" },
        { status: 409 }
      );
    }

    // Hash password and insert
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      email,
      passwordHash,
      nim,
      yearOfEntry,
      phone,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
