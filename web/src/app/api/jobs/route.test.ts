import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPostRequest,
  createGetRequest,
  parseJsonResponse,
} from "@/test/helpers";

const { mockDb, mockAuth, mockJobsChain, mockJobsWithPosterQuery, mockFindJobOwner, mockGetImageProxyUrl } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    offset: fn(),
    orderBy: fn(),
    insert: fn(),
    values: fn(),
    returning: fn(),
    delete: fn(),
    update: fn(),
    set: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockResolvedValue([{ count: 0 }]);
  chain.insert.mockReturnValue({ values: chain.values });
  chain.values.mockReturnValue({ returning: chain.returning });
  chain.returning.mockResolvedValue([{ id: "job-1" }]);

  const jobsChain = {
    where: fn(),
    orderBy: fn(),
    limit: fn(),
    offset: fn(),
  };
  jobsChain.where.mockReturnValue({ orderBy: jobsChain.orderBy });
  jobsChain.orderBy.mockReturnValue({ limit: jobsChain.limit });
  jobsChain.limit.mockReturnValue({ offset: jobsChain.offset });
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

import { GET, POST } from "./route";

const validJob = {
  title: "Software Engineer",
  company: "Tech Corp",
  location: "Jakarta",
  contractType: "Full-time",
  workingType: "Remote",
  contactName: "John Doe",
  contactPhone: "081234567890",
};

describe("GET /api/jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup db chains
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockResolvedValue([{ count: 0 }]);
    mockDb.insert.mockReturnValue({ values: mockDb.values });
    mockDb.values.mockReturnValue({ returning: mockDb.returning });
    mockDb.returning.mockResolvedValue([{ id: "job-1" }]);
    // Re-setup jobs chain
    mockJobsWithPosterQuery.mockReturnValue(mockJobsChain);
    mockJobsChain.where.mockReturnValue({ orderBy: mockJobsChain.orderBy });
    mockJobsChain.orderBy.mockReturnValue({ limit: mockJobsChain.limit });
    mockJobsChain.limit.mockReturnValue({ offset: mockJobsChain.offset });
    mockJobsChain.offset.mockResolvedValue([]);
    mockGetImageProxyUrl.mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/jobs");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns published jobs with total count", async () => {
    const jobData = [
      {
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
      },
    ];
    mockJobsChain.offset.mockResolvedValueOnce(jobData);
    mockDb.where.mockResolvedValueOnce([{ count: 1 }]);

    const req = createGetRequest("/api/jobs");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(mockGetImageProxyUrl).toHaveBeenCalledWith("company-images/tech.jpg");
  });

  it("returns 500 on error", async () => {
    mockJobsChain.offset.mockRejectedValueOnce(new Error("DB error"));
    const req = createGetRequest("/api/jobs");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("POST /api/jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup db chains
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockResolvedValue([{ count: 0 }]);
    mockDb.insert.mockReturnValue({ values: mockDb.values });
    mockDb.values.mockReturnValue({ returning: mockDb.returning });
    mockDb.returning.mockResolvedValue([{ id: "job-1", ...validJob }]);
    // Re-setup jobs chain
    mockJobsWithPosterQuery.mockReturnValue(mockJobsChain);
    mockJobsChain.where.mockReturnValue({ orderBy: mockJobsChain.orderBy });
    mockJobsChain.orderBy.mockReturnValue({ limit: mockJobsChain.limit });
    mockJobsChain.limit.mockReturnValue({ offset: mockJobsChain.offset });
    mockJobsChain.offset.mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPostRequest("/api/jobs", validJob);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when required fields missing", async () => {
    const req = createPostRequest("/api/jobs", { title: "Only title" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toContain("Missing required fields");
  });

  it("returns 400 for invalid contractType", async () => {
    const req = createPostRequest("/api/jobs", { ...validJob, contractType: "InvalidType" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid contractType");
  });

  it("returns 400 for invalid workingType", async () => {
    const req = createPostRequest("/api/jobs", { ...validJob, workingType: "InvalidType" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid workingType");
  });

  it("returns 400 for invalid status", async () => {
    const req = createPostRequest("/api/jobs", { ...validJob, status: "invalid_status" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid status");
  });

  it("creates job successfully", async () => {
    const req = createPostRequest("/api/jobs", validJob);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(201);
    expect(body.data).toBeDefined();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("maps published status to pending_review", async () => {
    const req = createPostRequest("/api/jobs", { ...validJob, status: "published" });
    const { status } = await parseJsonResponse(await POST(req));
    expect(status).toBe(201);
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_review" })
    );
  });

  it("returns 500 on error", async () => {
    mockDb.returning.mockRejectedValueOnce(new Error("DB error"));
    const req = createPostRequest("/api/jobs", validJob);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
