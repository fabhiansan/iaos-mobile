import { NextRequest, NextResponse } from "next/server";
import { eq, ilike, and, or, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { uploadToS3, getS3Key, getSignedDownloadUrl } from "@/lib/s3";
import { jobsWithPosterQuery } from "@/lib/job-queries";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const contractType = searchParams.get("contractType") || "";
    const workingType = searchParams.get("workingType") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const conditions = [eq(jobs.status, "published")];

    if (search) {
      conditions.push(
        or(
          ilike(jobs.title, `%${search}%`),
          ilike(jobs.company, `%${search}%`)
        )!
      );
    }

    if (contractType && contractType !== "All Contract") {
      conditions.push(eq(jobs.contractType, contractType as typeof jobs.contractType.enumValues[number]));
    }

    if (workingType && workingType !== "All Type") {
      conditions.push(eq(jobs.workingType, workingType as typeof jobs.workingType.enumValues[number]));
    }

    const where = and(...conditions);

    const [totalResult, rows] = await Promise.all([
      db.select({ count: count() }).from(jobs).where(where),
      jobsWithPosterQuery()
        .where(where)
        .orderBy(sql`${jobs.createdAt} DESC`)
        .limit(limit)
        .offset(offset),
    ]);

    // Generate signed URLs for company images
    const data = await Promise.all(
      rows.map(async (row) => {
        let companyImageSignedUrl: string | null = null;
        if (row.companyImageUrl) {
          try {
            companyImageSignedUrl = await getSignedDownloadUrl(row.companyImageUrl);
          } catch {
            // Ignore S3 errors for image URLs
          }
        }
        return { ...row, companyImageSignedUrl };
      })
    );

    return NextResponse.json({ data, total: totalResult[0].count });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let title: string;
    let company: string;
    let location: string;
    let contractType: string;
    let workingType: string;
    let contactName: string;
    let contactPhone: string;
    let status: string;
    let companyImageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = formData.get("title") as string;
      company = formData.get("company") as string;
      location = formData.get("location") as string;
      contractType = formData.get("contractType") as string;
      workingType = formData.get("workingType") as string;
      contactName = formData.get("contactName") as string;
      contactPhone = formData.get("contactPhone") as string;
      status = (formData.get("status") as string) || "draft";

      const file = formData.get("companyImage") as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const key = getS3Key("company-images", file.name);
        await uploadToS3(key, buffer, file.type);
        companyImageUrl = key;
      }
    } else {
      const body = await request.json();
      title = body.title;
      company = body.company;
      location = body.location;
      contractType = body.contractType;
      workingType = body.workingType;
      contactName = body.contactName;
      contactPhone = body.contactPhone;
      status = body.status || "draft";
      companyImageUrl = body.companyImageUrl || null;
    }

    if (!title || !company || !location || !contractType || !workingType || !contactName || !contactPhone) {
      return NextResponse.json(
        { error: "Missing required fields: title, company, location, contractType, workingType, contactName, contactPhone" },
        { status: 400 }
      );
    }

    const validContractTypes = jobs.contractType.enumValues;
    const validWorkingTypes = jobs.workingType.enumValues;
    const validStatuses = jobs.status.enumValues;

    if (!validContractTypes.includes(contractType as typeof validContractTypes[number])) {
      return NextResponse.json({ error: "Invalid contractType" }, { status: 400 });
    }
    if (!validWorkingTypes.includes(workingType as typeof validWorkingTypes[number])) {
      return NextResponse.json({ error: "Invalid workingType" }, { status: 400 });
    }
    if (!validStatuses.includes(status as typeof validStatuses[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [created] = await db
      .insert(jobs)
      .values({
        title,
        company,
        companyImageUrl,
        location,
        contractType: contractType as typeof validContractTypes[number],
        workingType: workingType as typeof validWorkingTypes[number],
        contactName,
        contactPhone,
        status: status as typeof validStatuses[number],
        postedById: session.user.id,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
