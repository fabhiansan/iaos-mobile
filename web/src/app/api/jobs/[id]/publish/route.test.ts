import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPostRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth, mockFindJobOwner } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    returning: fn(),
    update: fn(),
    set: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit, returning: chain.returning });
  chain.limit.mockResolvedValue([]);
  chain.returning.mockResolvedValue([{ id: "job-1", status: "pending_review" }]);
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });

  return {
    mockDb: chain,
    mockAuth: fn(),
    mockFindJobOwner: fn(),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  jobs: {
    id: "id",
    title: "title",
    company: "company",
    companyImageUrl: "companyImageUrl",
    location: "location",
    contractType: {
      enumValues: ["Full-time", "Contract", "Part-time", "Project Based", "Internship"],
    },
    workingType: {
      enumValues: ["On-site", "Remote", "Hybrid"],
    },
    contactName: "contactName",
    contactPhone: "contactPhone",
    status: {
      enumValues: ["draft", "pending_review", "published"],
    },
    postedById: "postedById",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  users: { id: "id", name: "name", yearOfEntry: "yearOfEntry" },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/job-queries", () => ({
  findJobOwner: mockFindJobOwner,
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  ilike: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  sql: vi.fn(),
  count: vi.fn(),
  inArray: vi.fn(),
  desc: vi.fn(),
}));

import { POST } from "./route";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("POST /api/jobs/[id]/publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup db chains
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit, returning: mockDb.returning });
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.returning.mockResolvedValue([{ id: "job-1", status: "pending_review" }]);
    mockFindJobOwner.mockResolvedValue({ postedById: "user-123" });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPostRequest("/api/jobs/job-1/publish", {});
    const { status, body } = await parseJsonResponse(await POST(req, makeParams("job-1")));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when job not found", async () => {
    mockFindJobOwner.mockResolvedValueOnce(null);
    const req = createPostRequest("/api/jobs/job-1/publish", {});
    const { status, body } = await parseJsonResponse(await POST(req, makeParams("job-1")));
    expect(status).toBe(404);
    expect(body.error).toBe("Job not found");
  });

  it("returns 403 when not owner", async () => {
    mockFindJobOwner.mockResolvedValueOnce({ postedById: "other-user" });
    const req = createPostRequest("/api/jobs/job-1/publish", {});
    const { status, body } = await parseJsonResponse(await POST(req, makeParams("job-1")));
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("publishes job successfully (sets pending_review)", async () => {
    const req = createPostRequest("/api/jobs/job-1/publish", {});
    const { status, body } = await parseJsonResponse(await POST(req, makeParams("job-1")));
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_review" })
    );
  });

  it("returns 500 on error", async () => {
    mockFindJobOwner.mockRejectedValueOnce(new Error("DB error"));
    const req = createPostRequest("/api/jobs/job-1/publish", {});
    const { status, body } = await parseJsonResponse(await POST(req, makeParams("job-1")));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
