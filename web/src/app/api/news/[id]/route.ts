import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [article] = await db
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
      .where(eq(articles.id, id))
      .limit(1);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ data: article });
  } catch (error) {
    console.error("GET /api/news/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const [existing] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;

    const [updated] = await db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/news/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await db.delete(articles).where(eq(articles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/news/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
