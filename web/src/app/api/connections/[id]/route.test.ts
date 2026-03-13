import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGetRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    orderBy: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ orderBy: chain.orderBy, limit: chain.limit });
  chain.orderBy.mockResolvedValue([]);
  chain.limit.mockResolvedValue([]);
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
  },
  careerHistory: {
    id: "id",
    userId: "userId",
    position: "position",
    company: "company",
    startYear: "startYear",
    endYear: "endYear",
    isCurrent: "isCurrent",
  },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
}));

import { GET } from "./route";

const mockUser = {
  id: "user-123",
  name: "Jane Doe",
  email: "jane@example.com",
  nim: "67890",
  yearOfEntry: 2019,
  phone: "08198765432",
  profileImageUrl: "jane.jpg",
  emailVerified: true,
};

const mockCareers = [
  {
    id: "career-1",
    position: "Product Manager",
    company: "Tech Inc",
    startYear: 2021,
    endYear: null,
    isCurrent: true,
  },
  {
    id: "career-2",
    position: "Analyst",
    company: "Data Co",
    startYear: 2019,
    endYear: 2021,
    isCurrent: false,
  },
];

function setupChains() {
  mockDb.select.mockReturnValue({ from: mockDb.from });
  mockDb.from.mockReturnValue({ where: mockDb.where });
  mockDb.where.mockReturnValue({
    orderBy: mockDb.orderBy,
    limit: mockDb.limit,
  });
  mockDb.orderBy.mockResolvedValue([]);
  mockDb.limit.mockResolvedValue([]);
}

describe("GET /api/connections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "current-user" } });
    setupChains();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/connections/user-123");
    const { status, body } = await parseJsonResponse(
      await GET(req, { params: Promise.resolve({ id: "user-123" }) })
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when user not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const req = createGetRequest("/api/connections/nonexistent");
    const { status, body } = await parseJsonResponse(
      await GET(req, { params: Promise.resolve({ id: "nonexistent" }) })
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("returns user profile with careers on success", async () => {
    // 1st chain (user query): select -> from -> where -> limit
    mockDb.limit.mockResolvedValueOnce([mockUser]);
    // 2nd chain (career query): select -> from -> where -> orderBy
    mockDb.orderBy.mockResolvedValueOnce(mockCareers);

    const req = createGetRequest("/api/connections/user-123");
    const { status, body } = await parseJsonResponse(
      await GET(req, { params: Promise.resolve({ id: "user-123" }) })
    );
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.id).toBe("user-123");
    expect(data.name).toBe("Jane Doe");
    expect(data.isVerified).toBe(true);
    expect(data.careers).toHaveLength(2);
    const careers = data.careers as Record<string, unknown>[];
    expect(careers[0].position).toBe("Product Manager");
    expect(careers[1].company).toBe("Data Co");
  });

  it("returns user profile with empty careers when career query fails", async () => {
    // User query succeeds
    mockDb.limit.mockResolvedValueOnce([mockUser]);
    // Career query throws (table doesn't exist)
    mockDb.orderBy.mockRejectedValueOnce(new Error("relation does not exist"));

    const req = createGetRequest("/api/connections/user-123");
    const { status, body } = await parseJsonResponse(
      await GET(req, { params: Promise.resolve({ id: "user-123" }) })
    );
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.id).toBe("user-123");
    expect(data.careers).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB error"));

    const req = createGetRequest("/api/connections/user-123");
    const { status, body } = await parseJsonResponse(
      await GET(req, { params: Promise.resolve({ id: "user-123" }) })
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
