import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseJsonResponse } from "@/test/helpers";
import { NextRequest } from "next/server";

const { mockDb, mockAuth, mockUploadToS3, mockGetS3Key } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    insert: fn(),
    values: fn(),
    returning: fn(),
  };
  // select().from().where().limit()
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit });
  chain.limit.mockResolvedValue([]);
  // insert().values().returning()
  chain.insert.mockReturnValue({ values: chain.values });
  chain.values.mockReturnValue({ returning: chain.returning });
  chain.returning.mockResolvedValue([{ id: "tx-1" }]);
  return {
    mockDb: chain,
    mockAuth: fn(),
    mockUploadToS3: fn().mockResolvedValue(undefined),
    mockGetS3Key: fn().mockReturnValue("donations/test/key"),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  donationCampaigns: { id: "id" },
  donationTransactions: {
    id: "id",
    campaignId: "campaignId",
    donorId: "donorId",
    amount: "amount",
    status: "status",
    proofImageUrl: "proofImageUrl",
    createdAt: "createdAt",
    verifiedAt: "verifiedAt",
  },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/s3", () => ({
  uploadToS3: mockUploadToS3,
  getS3Key: mockGetS3Key,
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

import { POST } from "./route";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

function createFormDataPostRequest(url: string, formData: FormData) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/donations/[id]/upload-proof", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup chains after clearAllMocks
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([{ id: "campaign-1" }]);
    mockDb.insert.mockReturnValue({ values: mockDb.values });
    mockDb.values.mockReturnValue({ returning: mockDb.returning });
    mockDb.returning.mockResolvedValue([
      {
        id: "tx-1",
        campaignId: "campaign-1",
        donorId: "user-123",
        amount: 500000,
        proofImageUrl: "donations/test/key",
        status: "pending",
      },
    ]);
    mockUploadToS3.mockResolvedValue(undefined);
    mockGetS3Key.mockReturnValue("donations/test/key");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.append("file", new File(["test"], "proof.jpg", { type: "image/jpeg" }));
    formData.append("amount", "500000");
    const req = createFormDataPostRequest(
      "/api/donations/campaign-1/upload-proof",
      formData
    );
    const { status, body } = await parseJsonResponse(
      await POST(req, makeParams("campaign-1"))
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when campaign not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const formData = new FormData();
    formData.append("file", new File(["test"], "proof.jpg", { type: "image/jpeg" }));
    formData.append("amount", "500000");
    const req = createFormDataPostRequest(
      "/api/donations/nonexistent/upload-proof",
      formData
    );
    const { status, body } = await parseJsonResponse(
      await POST(req, makeParams("nonexistent"))
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Campaign not found");
  });

  it("returns 400 when file or amount missing", async () => {
    const formData = new FormData();
    // No file or amount
    const req = createFormDataPostRequest(
      "/api/donations/campaign-1/upload-proof",
      formData
    );
    const { status, body } = await parseJsonResponse(
      await POST(req, makeParams("campaign-1"))
    );
    expect(status).toBe(400);
    expect(body.error).toBe("File and amount are required");
  });

  it("returns 400 for invalid amount", async () => {
    const formData = new FormData();
    formData.append("file", new File(["test"], "proof.jpg", { type: "image/jpeg" }));
    formData.append("amount", "-100");
    const req = createFormDataPostRequest(
      "/api/donations/campaign-1/upload-proof",
      formData
    );
    const { status, body } = await parseJsonResponse(
      await POST(req, makeParams("campaign-1"))
    );
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid amount");
  });

  it("uploads proof and creates transaction", async () => {
    const formData = new FormData();
    formData.append("file", new File(["test"], "proof.jpg", { type: "image/jpeg" }));
    formData.append("amount", "500000");
    const req = createFormDataPostRequest(
      "/api/donations/campaign-1/upload-proof",
      formData
    );
    const { status, body } = await parseJsonResponse(
      await POST(req, makeParams("campaign-1"))
    );
    expect(status).toBe(201);
    expect(body.data).toBeDefined();
    expect(body.data.status).toBe("pending");
    expect(mockUploadToS3).toHaveBeenCalled();
    expect(mockGetS3Key).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB error"));
    const formData = new FormData();
    formData.append("file", new File(["test"], "proof.jpg", { type: "image/jpeg" }));
    formData.append("amount", "500000");
    const req = createFormDataPostRequest(
      "/api/donations/campaign-1/upload-proof",
      formData
    );
    const { status, body } = await parseJsonResponse(
      await POST(req, makeParams("campaign-1"))
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
