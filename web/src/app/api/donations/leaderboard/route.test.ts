import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGetRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    innerJoin: fn(),
    groupBy: fn(),
    orderBy: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ innerJoin: chain.innerJoin });
  chain.innerJoin.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ groupBy: chain.groupBy });
  chain.groupBy.mockReturnValue({ orderBy: chain.orderBy });
  chain.orderBy.mockResolvedValue([]);
  return {
    mockDb: chain,
    mockAuth: fn(),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  donationTransactions: {
    id: "id",
    campaignId: "campaignId",
    donorId: "donorId",
    amount: "amount",
    status: "status",
  },
  users: { id: "id", name: "name", yearOfEntry: "yearOfEntry" },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  sql: vi.fn().mockImplementation(() => ({ as: vi.fn() })),
  desc: vi.fn(),
}));

import { GET } from "./route";

describe("GET /api/donations/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup chains after clearAllMocks
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ innerJoin: mockDb.innerJoin });
    mockDb.innerJoin.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ groupBy: mockDb.groupBy });
    mockDb.groupBy.mockReturnValue({ orderBy: mockDb.orderBy });
    mockDb.orderBy.mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/donations/leaderboard");
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns leaderboard data on success", async () => {
    const byYearData = [
      { yearOfEntry: 2020, totalAmount: 5000000, donorCount: 10 },
    ];
    const byIndividualData = [
      {
        donorId: "user-1",
        donorName: "John Doe",
        yearOfEntry: 2020,
        totalAmount: 1000000,
      },
    ];

    // Two sequential calls: first orderBy resolves to byYearOfEntry, second to byIndividual
    mockDb.orderBy
      .mockResolvedValueOnce(byYearData)
      .mockResolvedValueOnce(byIndividualData);

    const req = createGetRequest("/api/donations/leaderboard");
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.byYearOfEntry).toHaveLength(1);
    expect(body.data.byYearOfEntry[0].rank).toBe(1);
    expect(body.data.byYearOfEntry[0].name).toBe("2020");
    expect(body.data.byIndividual).toHaveLength(1);
    expect(body.data.byIndividual[0].rank).toBe(1);
    expect(body.data.byIndividual[0].name).toBe("John Doe");
    expect(body.data.byIndividual[0].initials).toBe("JD");
  });

  it("returns 500 on error", async () => {
    mockDb.orderBy.mockRejectedValueOnce(new Error("DB error"));
    const req = createGetRequest("/api/donations/leaderboard");
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
