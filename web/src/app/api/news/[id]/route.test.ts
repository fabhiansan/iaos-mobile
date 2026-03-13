import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGetRequest,
  createPutRequest,
  createDeleteRequest,
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
  // select().from().leftJoin().where().limit()
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ leftJoin: chain.leftJoin, where: chain.where });
  chain.leftJoin.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit, returning: chain.returning });
  chain.limit.mockResolvedValue([]);
  // update().set().where().returning()
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });
  chain.returning.mockResolvedValue([{ id: "article-1" }]);
  // delete().where()
  chain.delete.mockReturnValue({ where: chain.where });
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
}));

import { GET, PUT, DELETE } from "./route";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const sampleArticle = {
  id: "article-1",
  title: "Test Article",
  summary: "A summary",
  content: "Full content",
  category: "News",
  imageUrl: "image-key.jpg",
  isFeatured: false,
  authorId: "user-123",
  authorName: "John",
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /api/news/[id]", () => {
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
      limit: mockDb.limit,
      returning: mockDb.returning,
    });
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.returning.mockResolvedValue([{ id: "article-1" }]);
    mockDb.delete.mockReturnValue({ where: mockDb.where });
    mockGetImageProxyUrl.mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/news/article-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, makeParams("article-1"))
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when article not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createGetRequest("/api/news/nonexistent");
    const { status, body } = await parseJsonResponse(
      await GET(req, makeParams("nonexistent"))
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Article not found");
  });

  it("returns article on success", async () => {
    mockDb.limit.mockResolvedValueOnce([sampleArticle]);
    const req = createGetRequest("/api/news/article-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, makeParams("article-1"))
    );
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(mockGetImageProxyUrl).toHaveBeenCalledWith("image-key.jpg");
  });

  it("returns 500 on error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB error"));
    const req = createGetRequest("/api/news/article-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, makeParams("article-1"))
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("PUT /api/news/[id]", () => {
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
      limit: mockDb.limit,
      returning: mockDb.returning,
    });
    mockDb.limit.mockResolvedValue([{ id: "article-1" }]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.returning.mockResolvedValue([
      { id: "article-1", title: "Updated Title" },
    ]);
    mockDb.delete.mockReturnValue({ where: mockDb.where });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPutRequest("/api/news/article-1", {
      title: "Updated",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("article-1"))
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", role: "member" },
    });
    const req = createPutRequest("/api/news/article-1", {
      title: "Updated",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("article-1"))
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when article not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createPutRequest("/api/news/nonexistent", {
      title: "Updated",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("nonexistent"))
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Article not found");
  });

  it("updates article successfully", async () => {
    const req = createPutRequest("/api/news/article-1", {
      title: "Updated Title",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("article-1"))
    );
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB error"));
    const req = createPutRequest("/api/news/article-1", {
      title: "Updated",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("article-1"))
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("DELETE /api/news/[id]", () => {
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
      limit: mockDb.limit,
      returning: mockDb.returning,
    });
    mockDb.limit.mockResolvedValue([{ id: "article-1" }]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.returning.mockResolvedValue([{ id: "article-1" }]);
    mockDb.delete.mockReturnValue({ where: mockDb.where });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createDeleteRequest("/api/news/article-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("article-1"))
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", role: "member" },
    });
    const req = createDeleteRequest("/api/news/article-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("article-1"))
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when article not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createDeleteRequest("/api/news/nonexistent");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("nonexistent"))
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Article not found");
  });

  it("deletes article successfully", async () => {
    // First call: select for existence check resolves with article
    // The where after delete should resolve (void)
    mockDb.where
      .mockReturnValueOnce({ limit: mockDb.limit }) // select().from().where() -> { limit }
      .mockResolvedValueOnce(undefined); // delete().where() -> resolves

    const req = createDeleteRequest("/api/news/article-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("article-1"))
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB error"));
    const req = createDeleteRequest("/api/news/article-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("article-1"))
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
