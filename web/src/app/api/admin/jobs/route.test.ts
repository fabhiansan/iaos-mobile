import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGetRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth, mockJobsWithPosterQuery } = vi.hoisted(() => {
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
  chain.where.mockResolvedValue([{ count: 0 }]);

  const jobChain = {
    where: fn(),
    orderBy: fn(),
    limit: fn(),
    offset: fn(),
  };
  jobChain.where.mockReturnValue({ orderBy: jobChain.orderBy });
  jobChain.orderBy.mockReturnValue({ limit: jobChain.limit });
  jobChain.limit.mockReturnValue({ offset: jobChain.offset });
  jobChain.offset.mockResolvedValue([]);

  return {
    mockDb: chain,
    mockAuth: fn(),
    mockJobsWithPosterQuery: Object.assign(fn().mockReturnValue(jobChain), {
      chain: jobChain,
    }),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  jobs: {
    id: "id",
    title: "title",
    company: "company",
    status: "status",
    createdAt: "createdAt",
  },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/job-queries", () => ({
  jobsWithPosterQuery: mockJobsWithPosterQuery,
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

const mockJobData = [
  { id: "j1", title: "Dev", company: "Acme", status: "published" },
  { id: "j2", title: "QA", company: "Corp", status: "draft" },
];

describe("GET /api/admin/jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockResolvedValue([{ count: 0 }]);

    const jc = mockJobsWithPosterQuery.chain;
    mockJobsWithPosterQuery.mockReturnValue(jc);
    jc.where.mockReturnValue({ orderBy: jc.orderBy });
    jc.orderBy.mockReturnValue({ limit: jc.limit });
    jc.limit.mockReturnValue({ offset: jc.offset });
    jc.offset.mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/admin/jobs");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const req = createGetRequest("/api/admin/jobs");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns jobs list with total", async () => {
    mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
    mockJobsWithPosterQuery.chain.offset.mockResolvedValueOnce(mockJobData);

    const req = createGetRequest("/api/admin/jobs");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it("returns 500 on error", async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    const req = createGetRequest("/api/admin/jobs");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
