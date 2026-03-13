import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGetRequest,
  createPutRequest,
  createDeleteRequest,
  parseJsonResponse,
} from "@/test/helpers";

const { mockDb, mockAuth, mockJobsChain, mockJobsWithPosterQuery, mockFindJobOwner, mockGetImageProxyUrl } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    insert: fn(),
    values: fn(),
    returning: fn(),
    delete: fn(),
    update: fn(),
    set: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit });
  chain.limit.mockResolvedValue([]);
  chain.insert.mockReturnValue({ values: chain.values });
  chain.values.mockReturnValue({ returning: chain.returning });
  chain.returning.mockResolvedValue([{ id: "job-1" }]);
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });
  chain.delete.mockReturnValue({ where: chain.where });

  const jobsChain = {
    where: fn(),
    orderBy: fn(),
    limit: fn(),
    offset: fn(),
  };
  jobsChain.where.mockReturnValue({ orderBy: jobsChain.orderBy, limit: jobsChain.limit });
  jobsChain.orderBy.mockReturnValue({ limit: jobsChain.limit });
  jobsChain.limit.mockResolvedValue([]);
  jobsChain.offset.mockResolvedValue([]);

  return {
    mockDb: chain,
    mockAuth: fn(),
    mockJobsChain: jobsChain,
    mockJobsWithPosterQuery: fn().mockReturnValue(jobsChain),
    mockFindJobOwner: fn(),
    mockGetImageProxyUrl: fn().mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    ),
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
vi.mock("@/lib/s3", () => ({
  getImageProxyUrl: mockGetImageProxyUrl,
  uploadToS3: vi.fn(),
  getS3Key: vi.fn().mockReturnValue("company-images/test.jpg"),
}));
vi.mock("@/lib/job-queries", () => ({
  jobsWithPosterQuery: mockJobsWithPosterQuery,
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

import { GET, PUT, DELETE } from "./route";

const mockJob = {
  id: "job-1",
  title: "Software Engineer",
  company: "Tech Corp",
  companyImageUrl: "company-images/tech.jpg",
  location: "Jakarta",
  contractType: "Full-time",
  workingType: "Remote",
  contactName: "John",
  contactPhone: "081234567890",
  status: "published",
  postedById: "user-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  posterName: "John Doe",
  posterYearOfEntry: 2023,
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup db chains
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.delete.mockReturnValue({ where: mockDb.where });
    // Re-setup jobs chain
    mockJobsWithPosterQuery.mockReturnValue(mockJobsChain);
    mockJobsChain.where.mockReturnValue({ orderBy: mockJobsChain.orderBy, limit: mockJobsChain.limit });
    mockJobsChain.orderBy.mockReturnValue({ limit: mockJobsChain.limit });
    mockJobsChain.limit.mockResolvedValue([]);
    mockGetImageProxyUrl.mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    );
    mockFindJobOwner.mockResolvedValue(null);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await GET(req, makeParams("job-1")));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when job not found", async () => {
    mockJobsChain.limit.mockResolvedValueOnce([]);
    const req = createGetRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await GET(req, makeParams("job-1")));
    expect(status).toBe(404);
    expect(body.error).toBe("Job not found");
  });

  it("returns job with signed company image URL", async () => {
    mockJobsChain.limit.mockResolvedValueOnce([mockJob]);
    const req = createGetRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await GET(req, makeParams("job-1")));
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.id).toBe("job-1");
    expect(data.companyImageSignedUrl).toBe(
      `/api/images/${encodeURIComponent("company-images/tech.jpg")}`
    );
    expect(mockGetImageProxyUrl).toHaveBeenCalledWith("company-images/tech.jpg");
  });

  it("returns 500 on error", async () => {
    mockJobsChain.limit.mockRejectedValueOnce(new Error("DB error"));
    const req = createGetRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await GET(req, makeParams("job-1")));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("PUT /api/jobs/[id]", () => {
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
    mockDb.returning.mockResolvedValue([{ id: "job-1", title: "Updated" }]);
    mockDb.delete.mockReturnValue({ where: mockDb.where });
    // Re-setup jobs chain
    mockJobsWithPosterQuery.mockReturnValue(mockJobsChain);
    mockJobsChain.where.mockReturnValue({ orderBy: mockJobsChain.orderBy, limit: mockJobsChain.limit });
    mockJobsChain.orderBy.mockReturnValue({ limit: mockJobsChain.limit });
    mockJobsChain.limit.mockResolvedValue([]);
    mockFindJobOwner.mockResolvedValue({ postedById: "user-123" });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPutRequest("/api/jobs/job-1", { title: "Updated" });
    const { status, body } = await parseJsonResponse(await PUT(req, makeParams("job-1")));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when job not found", async () => {
    mockFindJobOwner.mockResolvedValueOnce(null);
    const req = createPutRequest("/api/jobs/job-1", { title: "Updated" });
    const { status, body } = await parseJsonResponse(await PUT(req, makeParams("job-1")));
    expect(status).toBe(404);
    expect(body.error).toBe("Job not found");
  });

  it("returns 403 when not owner", async () => {
    mockFindJobOwner.mockResolvedValueOnce({ postedById: "other-user" });
    const req = createPutRequest("/api/jobs/job-1", { title: "Updated" });
    const { status, body } = await parseJsonResponse(await PUT(req, makeParams("job-1")));
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("updates job successfully", async () => {
    const req = createPutRequest("/api/jobs/job-1", { title: "Updated Title" });
    const { status, body } = await parseJsonResponse(await PUT(req, makeParams("job-1")));
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("maps published status to pending_review", async () => {
    const req = createPutRequest("/api/jobs/job-1", { status: "published" });
    const { status } = await parseJsonResponse(await PUT(req, makeParams("job-1")));
    expect(status).toBe(200);
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_review" })
    );
  });

  it("returns 500 on error", async () => {
    mockFindJobOwner.mockRejectedValueOnce(new Error("DB error"));
    const req = createPutRequest("/api/jobs/job-1", { title: "Updated" });
    const { status, body } = await parseJsonResponse(await PUT(req, makeParams("job-1")));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("DELETE /api/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup db chains
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([]);
    mockDb.delete.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockResolvedValue(undefined);
    // Re-setup jobs chain
    mockJobsWithPosterQuery.mockReturnValue(mockJobsChain);
    mockJobsChain.where.mockReturnValue({ orderBy: mockJobsChain.orderBy, limit: mockJobsChain.limit });
    mockFindJobOwner.mockResolvedValue({ postedById: "user-123" });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createDeleteRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await DELETE(req, makeParams("job-1")));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when job not found", async () => {
    mockFindJobOwner.mockResolvedValueOnce(null);
    const req = createDeleteRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await DELETE(req, makeParams("job-1")));
    expect(status).toBe(404);
    expect(body.error).toBe("Job not found");
  });

  it("returns 403 when not owner", async () => {
    mockFindJobOwner.mockResolvedValueOnce({ postedById: "other-user" });
    const req = createDeleteRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await DELETE(req, makeParams("job-1")));
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("deletes job successfully", async () => {
    const req = createDeleteRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await DELETE(req, makeParams("job-1")));
    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true });
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockFindJobOwner.mockRejectedValueOnce(new Error("DB error"));
    const req = createDeleteRequest("/api/jobs/job-1");
    const { status, body } = await parseJsonResponse(await DELETE(req, makeParams("job-1")));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
