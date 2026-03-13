import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPostRequest,
  createGetRequest,
  parseJsonResponse,
} from "@/test/helpers";

const { mockDb, mockAuth, mockGetImageProxyUrl } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    offset: fn(),
    leftJoin: fn(),
    orderBy: fn(),
    insert: fn(),
    values: fn(),
    returning: fn(),
    delete: fn(),
    update: fn(),
    set: fn(),
  };
  // select().from().leftJoin().where().orderBy().limit().offset()
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ leftJoin: chain.leftJoin, where: chain.where });
  chain.leftJoin.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ orderBy: chain.orderBy, limit: chain.limit });
  chain.orderBy.mockReturnValue({ limit: chain.limit });
  chain.limit.mockReturnValue({ offset: chain.offset });
  chain.offset.mockResolvedValue([]);
  // insert().values().returning()
  chain.insert.mockReturnValue({ values: chain.values });
  chain.values.mockReturnValue({ returning: chain.returning });
  chain.returning.mockResolvedValue([{ id: "article-1" }]);
  return {
    mockDb: chain,
    mockAuth: fn(),
    mockGetImageProxyUrl: fn().mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    ),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  articles: {
    id: "id",
    title: "title",
    summary: "summary",
    content: "content",
    category: "category",
    imageUrl: "imageUrl",
    isFeatured: "isFeatured",
    authorId: "authorId",
    publishedAt: "publishedAt",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  users: { id: "id", name: "name" },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/s3", () => ({ getImageProxyUrl: mockGetImageProxyUrl }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  ilike: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
  count: vi.fn(),
}));

import { GET, POST } from "./route";

const validArticle = {
  title: "Test Article",
  summary: "A test summary",
  content: "Full article content here",
  category: "News",
};

describe("GET /api/news", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "admin" } });
    // Re-setup chains after clearAllMocks
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({
      leftJoin: mockDb.leftJoin,
      where: mockDb.where,
    });
    mockDb.leftJoin.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({
      orderBy: mockDb.orderBy,
      limit: mockDb.limit,
    });
    mockDb.orderBy.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockReturnValue({ offset: mockDb.offset });
    mockDb.offset.mockResolvedValue([]);
    mockDb.insert.mockReturnValue({ values: mockDb.values });
    mockDb.values.mockReturnValue({ returning: mockDb.returning });
    mockDb.returning.mockResolvedValue([{ id: "article-1" }]);
    mockGetImageProxyUrl.mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/news");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns articles with total count on success", async () => {
    const articleData = [
      {
        id: "a1",
        title: "Article 1",
        summary: "Summary 1",
        content: "Content 1",
        category: "News",
        imageUrl: "image-key.jpg",
        isFeatured: false,
        authorId: "user-123",
        authorName: "John",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    // First select chain (data query) resolves via offset
    mockDb.offset.mockResolvedValueOnce(articleData);
    // where is called twice: first for the data query (returns { orderBy, limit }),
    // then for the count query (resolves directly with count result).
    // Use mockReturnValueOnce for the first call so it returns the chain,
    // then mockResolvedValueOnce for the second call so it resolves to the count.
    mockDb.where
      .mockReturnValueOnce({ orderBy: mockDb.orderBy, limit: mockDb.limit })
      .mockResolvedValueOnce([{ count: 5 }]);

    const req = createGetRequest("/api/news");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(5);
    expect(mockGetImageProxyUrl).toHaveBeenCalledWith("image-key.jpg");
  });

  it("returns 500 on database error", async () => {
    mockDb.offset.mockRejectedValueOnce(new Error("DB error"));
    const req = createGetRequest("/api/news");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("POST /api/news", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({
      leftJoin: mockDb.leftJoin,
      where: mockDb.where,
    });
    mockDb.leftJoin.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({
      orderBy: mockDb.orderBy,
      limit: mockDb.limit,
    });
    mockDb.orderBy.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockReturnValue({ offset: mockDb.offset });
    mockDb.offset.mockResolvedValue([]);
    mockDb.insert.mockReturnValue({ values: mockDb.values });
    mockDb.values.mockReturnValue({ returning: mockDb.returning });
    mockDb.returning.mockResolvedValue([{ id: "article-1", ...validArticle }]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPostRequest("/api/news", validArticle);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", role: "member" },
    });
    const req = createPostRequest("/api/news", validArticle);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when required fields missing", async () => {
    const req = createPostRequest("/api/news", { title: "Only title" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe(
      "title, summary, content, and category are required"
    );
  });

  it("returns 400 for invalid category", async () => {
    const req = createPostRequest("/api/news", {
      ...validArticle,
      category: "InvalidCategory",
    });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid category");
  });

  it("creates article successfully", async () => {
    const req = createPostRequest("/api/news", validArticle);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(201);
    expect(body.data).toBeDefined();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    mockDb.returning.mockRejectedValueOnce(new Error("DB error"));
    const req = createPostRequest("/api/news", validArticle);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
