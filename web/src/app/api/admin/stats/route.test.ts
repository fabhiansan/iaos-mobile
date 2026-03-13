import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGetRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockResolvedValue([{ value: 0 }]);
  return {
    mockDb: chain,
    mockAuth: fn(),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: { id: "id" },
  articles: { id: "id" },
  jobs: { id: "id", status: "status" },
  donationCampaigns: { id: "id" },
  donationTransactions: { id: "id", status: "status", amount: "amount" },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  ilike: vi.fn(),
  desc: vi.fn(),
  count: vi.fn(),
  sum: vi.fn(),
}));

import { GET } from "./route";

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });

    const makeResult = (val: number) => [{ value: val }];
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockImplementation(() => ({
      where: mockDb.where,
      then: (resolve: (v: unknown) => void) =>
        Promise.resolve(makeResult(0)).then(resolve),
    }));
    mockDb.where.mockResolvedValue(makeResult(0));
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/admin/stats");
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns stats on success", async () => {
    const makeResult = (val: number) => [{ value: val }];

    let selectCallCount = 0;
    const results = [
      makeResult(10), // users
      makeResult(5), // articles
      makeResult(3), // jobs (published)
      makeResult(2), // campaigns
      makeResult(1), // pending transactions
      makeResult(5000), // total donated
      makeResult(4), // pending jobs
    ];

    mockDb.select.mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => {
        const idx = selectCallCount++;
        const result = results[idx] ?? makeResult(0);
        return {
          where: vi.fn().mockResolvedValue(result),
          then: (resolve: (v: unknown) => void) =>
            Promise.resolve(result).then(resolve),
        };
      }),
    }));

    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.users).toBe(10);
    expect(data.articles).toBe(5);
    expect(data.jobs).toBe(3);
    expect(data.campaigns).toBe(2);
    expect(data.pendingTransactions).toBe(1);
    expect(data.totalDonated).toBe(5000);
    expect(data.pendingJobs).toBe(4);
  });

  it("returns 500 on error", async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
