import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGetRequest,
  createPatchRequest,
  createDeleteRequest,
  parseJsonResponse,
} from "@/test/helpers";

const { mockDb, mockAuth, mockJobsWithPosterQuery } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    update: fn(),
    set: fn(),
    returning: fn(),
    delete: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit });
  chain.limit.mockResolvedValue([]);
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });
  chain.delete.mockReturnValue({ where: chain.where });

  const jobChain = {
    where: fn(),
    limit: fn(),
  };
  jobChain.where.mockReturnValue({ limit: jobChain.limit });
  jobChain.limit.mockResolvedValue([]);

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
  jobs: { id: "id", title: "title", status: "status" },
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
  sum: vi.fn(),
}));

import { GET, PATCH, DELETE } from "./route";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });
const mockJob = {
  id: "job-1",
  title: "Developer",
  company: "Acme",
  status: "published",
  posterName: "Alice",
};

describe("GET /api/admin/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.delete.mockReturnValue({ where: mockDb.where });

    const jc = mockJobsWithPosterQuery.chain;
    mockJobsWithPosterQuery.mockReturnValue(jc);
    jc.where.mockReturnValue({ limit: jc.limit });
    jc.limit.mockResolvedValue([mockJob]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/admin/jobs/job-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, mockParams("job-1")),
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const req = createGetRequest("/api/admin/jobs/job-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, mockParams("job-1")),
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when job not found", async () => {
    mockJobsWithPosterQuery.chain.limit.mockResolvedValueOnce([]);
    const req = createGetRequest("/api/admin/jobs/nonexistent");
    const { status, body } = await parseJsonResponse(
      await GET(req, mockParams("nonexistent")),
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Job not found");
  });

  it("returns job on success", async () => {
    const req = createGetRequest("/api/admin/jobs/job-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, mockParams("job-1")),
    );
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.id).toBe("job-1");
    expect(data.title).toBe("Developer");
  });
});

describe("PATCH /api/admin/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit, returning: mockDb.returning });
    mockDb.limit.mockResolvedValue([{ id: "job-1" }]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.returning.mockResolvedValue([{ ...mockJob, status: "draft" }]);
    mockDb.delete.mockReturnValue({ where: mockDb.where });

    const jc = mockJobsWithPosterQuery.chain;
    mockJobsWithPosterQuery.mockReturnValue(jc);
    jc.where.mockReturnValue({ limit: jc.limit });
    jc.limit.mockResolvedValue([mockJob]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPatchRequest("/api/admin/jobs/job-1", {
      status: "draft",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("job-1")),
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const req = createPatchRequest("/api/admin/jobs/job-1", {
      status: "draft",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("job-1")),
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 for invalid status", async () => {
    const req = createPatchRequest("/api/admin/jobs/job-1", {
      status: "archived",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("job-1")),
    );
    expect(status).toBe(400);
    expect(body.error).toBe(
      "Invalid status. Must be 'published', 'draft', or 'pending_review'.",
    );
  });

  it("returns 404 when job not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createPatchRequest("/api/admin/jobs/nonexistent", {
      status: "draft",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("nonexistent")),
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Job not found");
  });

  it("updates job status successfully", async () => {
    const updatedJob = { ...mockJob, status: "draft" };
    // First where call (select check): returns { limit }
    // Second where call (update): returns { returning }
    mockDb.where
      .mockReturnValueOnce({ limit: mockDb.limit }) // select existing
      .mockReturnValueOnce({ returning: mockDb.returning }); // update
    mockDb.limit.mockResolvedValueOnce([{ id: "job-1" }]);
    mockDb.returning.mockResolvedValueOnce([updatedJob]);

    const req = createPatchRequest("/api/admin/jobs/job-1", {
      status: "draft",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("job-1")),
    );
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.status).toBe("draft");
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([{ id: "job-1" }]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.delete.mockReturnValue({ where: mockDb.where });

    const jc = mockJobsWithPosterQuery.chain;
    mockJobsWithPosterQuery.mockReturnValue(jc);
    jc.where.mockReturnValue({ limit: jc.limit });
    jc.limit.mockResolvedValue([mockJob]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createDeleteRequest("/api/admin/jobs/job-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("job-1")),
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const req = createDeleteRequest("/api/admin/jobs/job-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("job-1")),
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when job not found", async () => {
    mockDb.where.mockReturnValueOnce({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createDeleteRequest("/api/admin/jobs/nonexistent");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("nonexistent")),
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Job not found");
  });

  it("deletes job successfully", async () => {
    // First where call (select check): returns { limit }
    // Second where call (delete): resolves
    mockDb.where
      .mockReturnValueOnce({ limit: mockDb.limit }) // select existing
      .mockResolvedValueOnce(undefined); // delete
    mockDb.limit.mockResolvedValueOnce([{ id: "job-1" }]);

    const req = createDeleteRequest("/api/admin/jobs/job-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("job-1")),
    );
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
