import { config } from "dotenv";
config({ path: ".env.local" });

async function seedAdmin() {
  const { db } = await import("../db");
  const { users } = await import("../db/schema");
  const bcrypt = await import("bcryptjs");
  const { eq } = await import("drizzle-orm");

  const email = "admin@iaos.id";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Admin user with email ${email} already exists. Skipping.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await db.insert(users).values({
    name: "IAOS Admin",
    email,
    passwordHash,
    nim: "ADMIN001",
    yearOfEntry: 2020,
    phone: "08123456789",
    role: "admin",
  });

  console.log(`Admin user created successfully (${email}).`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin user:", err);
  process.exit(1);
});
