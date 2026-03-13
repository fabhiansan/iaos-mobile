import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users, careerHistory } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [companyRows, yearRows] = await Promise.all([
      db
        .selectDistinct({ company: careerHistory.company })
        .from(careerHistory)
        .orderBy(careerHistory.company),
      db
        .selectDistinct({ yearOfEntry: users.yearOfEntry })
        .from(users)
        .orderBy(sql`${users.yearOfEntry} DESC`),
    ]);

    const companies = companyRows.map((r) => r.company);
    const years = yearRows.map((r) => String(r.yearOfEntry));

    return NextResponse.json({ companies, years });
  } catch (error) {
    console.error("Filters fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
