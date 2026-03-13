"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { completeProfileSchema } from "@/lib/validations";

export async function completeProfile(data: {
  nim: string;
  yearOfEntry: number;
  phone: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const result = completeProfileSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" };
  }

  const { nim, yearOfEntry, phone } = result.data;

  const [existingNim] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.nim, nim))
    .limit(1);

  if (existingNim && existingNim.id !== session.user.id) {
    return { error: "Student ID already registered" };
  }

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

  redirect("/news");
}
