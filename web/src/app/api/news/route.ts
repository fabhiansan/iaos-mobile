import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, ilike, desc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { articles, users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const conditions = [];

    if (category && category !== "All News") {
      conditions.push(eq(articles.category, category as "Announcement" | "Agenda" | "News"));
    }

    if (search) {
      conditions.push(
        or(
          ilike(articles.title, `%${search}%`),
          ilike(articles.summary, `%${search}%`)
        )!
      );
    }

    if (featured === "true") {
      conditions.push(eq(articles.isFeatured, true));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: articles.id,
          title: articles.title,
          summary: articles.summary,
          content: articles.content,
          category: articles.category,
          imageUrl: articles.imageUrl,
          isFeatured: articles.isFeatured,
          authorId: articles.authorId,
          authorName: users.name,
          publishedAt: articles.publishedAt,
          createdAt: articles.createdAt,
          updatedAt: articles.updatedAt,
        })
        .from(articles)
        .leftJoin(users, eq(articles.authorId, users.id))
        .where(where)
        .orderBy(desc(articles.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(articles)
        .where(where),
    ]);

    return NextResponse.json({
      data,
      total: totalResult[0].count,
    });
  } catch (error) {
    console.error("GET /api/news error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, summary, content, category, imageUrl, isFeatured } = await request.json();

    if (!title || !summary || !content || !category) {
      return NextResponse.json(
        { error: "title, summary, content, and category are required" },
        { status: 400 }
      );
    }

    const validCategories = ["Announcement", "Agenda", "News"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(articles)
      .values({
        title,
        summary,
        content,
        category,
        imageUrl: imageUrl || null,
        isFeatured: isFeatured || false,
        authorId: session.user.id,
        publishedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/news error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
