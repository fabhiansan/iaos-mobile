import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseJsonResponse } from "@/test/helpers";

const { mockAuth, mockJobsChain, mockJobsWithPosterQuery } = vi.hoisted(() => {
  const fn = vi.fn;

  const jobsChain = {
    where: fn(),
    orderBy: fn(),
    limit: fn(),
    offset: fn(),
  };
  jobsChain.where.mockReturnValue({ orderBy: jobsChain.orderBy });
  jobsChain.orderBy.mockResolvedValue([]);

  return {
    mockAuth: fn(),
    mockJobsChain: jobsChain,
    mockJobsWithPosterQuery: fn().mockReturnValue(jobsChain),
  };
});

vi.mock("@/db", () => ({ db: {} }));
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
  jobsWithPosterQuery: mockJobsWithPosterQuery,
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

import { GET } from "./route";

describe("GET /api/jobs/drafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup jobs chain
    mockJobsWithPosterQuery.mockReturnValue(mockJobsChain);
    mockJobsChain.where.mockReturnValue({ orderBy: mockJobsChain.orderBy });
    mockJobsChain.orderBy.mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns user's draft and pending_review jobs", async () => {
    const draftJobs = [
      {
        id: "job-1",
        title: "Draft Job",
        status: "draft",
        postedById: "user-123",
      },
      {
        id: "job-2",
        title: "Pending Job",
        status: "pending_review",
        postedById: "user-123",
      },
    ];
    mockJobsChain.orderBy.mockResolvedValueOnce(draftJobs);

    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(mockJobsWithPosterQuery).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockJobsChain.orderBy.mockRejectedValueOnce(new Error("DB error"));
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
