import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGetRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    offset: fn(),
    orderBy: fn(),
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
    yearOfEntry: "yearOfEntry",
    phone: "phone",
    profileImageUrl: "profileImageUrl",
    emailVerified: "emailVerified",
    createdAt: "createdAt",
  },
  careerHistory: {
    userId: "userId",
    position: "position",
    company: "company",
    isCurrent: "isCurrent",
    startYear: "startYear",
  },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  ilike: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
  count: vi.fn(),
}));

import { GET } from "./route";

const mockUser = {
  id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  nim: "12345",
  yearOfEntry: 2020,
  phone: "08123456789",
  profileImageUrl: "profile.jpg",
  emailVerified: true,
};

const mockCareer = {
  userId: "user-1",
  position: "Software Engineer",
  company: "Acme Corp",
  isCurrent: true,
  startYear: 2022,
};

function setupChains() {
  mockDb.select.mockReturnValue({ from: mockDb.from });
  mockDb.from.mockReturnValue({ where: mockDb.where });
  mockDb.where.mockReturnValue({
    orderBy: mockDb.orderBy,
    limit: mockDb.limit,
  });
  mockDb.orderBy.mockReturnValue({ limit: mockDb.limit });
  mockDb.limit.mockReturnValue({ offset: mockDb.offset });
  mockDb.offset.mockResolvedValue([]);
}

describe("GET /api/connections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    setupChains();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/connections");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns alumni list with career info on success", async () => {
    // Promise.all builds both chains synchronously before awaiting:
    //   count chain: select -> from -> where (awaited as promise)
    //   user  chain: select -> from -> where -> orderBy -> limit -> offset (awaited)
    // Then the career chain: select -> from -> where -> orderBy (awaited)
    //
    // Calls to shared mocks happen in this order:
    //   where #1 (count) -> where #2 (user) -> orderBy #1 (user) -> ... -> offset
    //   then: where #3 (career) -> orderBy #2 (career)

    // where call #1 (count query): resolve as promise with count result
    mockDb.where.mockResolvedValueOnce([{ value: 1 }]);
    // where call #2 (user query): return chain (default behavior, but
    // mockResolvedValueOnce consumed #1, so re-set the default return)
    // Actually the default mockReturnValue still applies after Once is consumed.

    // orderBy call #1 (user query): must return { limit } to continue chain
    mockDb.orderBy.mockReturnValueOnce({ limit: mockDb.limit });
    // offset (user query): resolve with user rows
    mockDb.offset.mockResolvedValueOnce([mockUser]);

    // orderBy call #2 (career query): resolve as promise with career data
    mockDb.orderBy.mockResolvedValueOnce([mockCareer]);

    const req = createGetRequest("/api/connections");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
    const alumni = (body.data as Record<string, unknown>[])[0];
    expect(alumni.id).toBe("user-1");
    expect(alumni.name).toBe("John Doe");
    expect(alumni.currentPosition).toBe("Software Engineer");
    expect(alumni.currentCompany).toBe("Acme Corp");
  });

  it("returns empty list when no users found", async () => {
    mockDb.where.mockResolvedValueOnce([{ value: 0 }]);
    mockDb.offset.mockResolvedValueOnce([]);

    const req = createGetRequest("/api/connections");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(200);
    expect(body.data).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it("returns 500 on database error", async () => {
    mockDb.where.mockRejectedValueOnce(new Error("DB error"));

    const req = createGetRequest("/api/connections");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
