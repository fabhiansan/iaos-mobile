import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGetRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    orderBy: fn(),
    limit: fn(),
    offset: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ orderBy: chain.orderBy, limit: chain.limit });
  chain.orderBy.mockReturnValue({ limit: chain.limit });
  chain.limit.mockReturnValue({ offset: chain.offset });
  chain.offset.mockResolvedValue([]);
  return {
    mockDb: chain,
    mockAuth: fn(),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: {
    id: "id",
    name: "name",
    email: "email",
    nim: "nim",
    role: "role",
    yearOfEntry: "yearOfEntry",
    createdAt: "createdAt",
  },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("./columns", () => ({
  safeUserColumns: { id: "id", name: "name", email: "email" },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  ilike: vi.fn(),
  desc: vi.fn(),
  count: vi.fn(),
}));

import { GET } from "./route";

const mockUserData = [
  { id: "u1", name: "Alice", email: "alice@test.com" },
  { id: "u2", name: "Bob", email: "bob@test.com" },
];

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({
      orderBy: mockDb.orderBy,
      limit: mockDb.limit,
    });
    mockDb.orderBy.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockReturnValue({ offset: mockDb.offset });
    mockDb.offset.mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/admin/users");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const req = createGetRequest("/api/admin/users");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns users list with total", async () => {
    // First where call: data query chain → { orderBy, limit }
    // Second where call: count query → resolves to [{ count: 2 }]
    mockDb.where
      .mockReturnValueOnce({ orderBy: mockDb.orderBy, limit: mockDb.limit })
      .mockResolvedValueOnce([{ count: 2 }]);
    mockDb.offset.mockResolvedValueOnce(mockUserData);

    const req = createGetRequest("/api/admin/users");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it("returns 500 on error", async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    const req = createGetRequest("/api/admin/users");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
