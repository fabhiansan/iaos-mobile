import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGetRequest,
  createPutRequest,
  createDeleteRequest,
  parseJsonResponse,
} from "@/test/helpers";

const { mockDb, mockAuth, mockGetImageProxyUrl, mockDeleteFromS3 } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    leftJoin: fn(),
    innerJoin: fn(),
    groupBy: fn(),
    orderBy: fn(),
    insert: fn(),
    values: fn(),
    returning: fn(),
    delete: fn(),
    update: fn(),
    set: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({
    leftJoin: chain.leftJoin,
    innerJoin: chain.innerJoin,
    where: chain.where,
  });
  chain.leftJoin.mockReturnValue({ where: chain.where });
  chain.innerJoin.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({
    groupBy: chain.groupBy,
    orderBy: chain.orderBy,
    limit: chain.limit,
    returning: chain.returning,
  });
  chain.groupBy.mockResolvedValue([]);
  chain.orderBy.mockReturnValue({ limit: chain.limit });
  chain.limit.mockResolvedValue([]);
  // update().set().where().returning()
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });
  chain.returning.mockResolvedValue([]);
  // delete().where().returning()
  chain.delete.mockReturnValue({ where: chain.where });
  // insert().values().returning()
  chain.insert.mockReturnValue({ values: chain.values });
  chain.values.mockReturnValue({ returning: chain.returning });
  return {
    mockDb: chain,
    mockAuth: fn(),
    mockGetImageProxyUrl: fn().mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    ),
    mockDeleteFromS3: fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  donationCampaigns: {
    id: "id",
    title: "title",
    description: "description",
    category: "category",
    imageUrl: "imageUrl",
    targetAmount: "targetAmount",
    currentAmount: "currentAmount",
    accountNumber: "accountNumber",
    bankName: "bankName",
    accountName: "accountName",
    donationInstructions: "donationInstructions",
    beneficiaryCount: "beneficiaryCount",
    createdAt: "createdAt",
  },
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
  donationReportImages: {
    id: "id",
    campaignId: "campaignId",
    imageKey: "imageKey",
    sortOrder: "sortOrder",
    createdAt: "createdAt",
  },
  donationReportTestimonies: {
    id: "id",
    campaignId: "campaignId",
    quote: "quote",
    name: "name",
    year: "year",
    sortOrder: "sortOrder",
    createdAt: "createdAt",
  },
  users: { id: "id", name: "name", yearOfEntry: "yearOfEntry" },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/s3", () => ({
  getImageProxyUrl: mockGetImageProxyUrl,
  deleteFromS3: mockDeleteFromS3,
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  sql: vi.fn().mockImplementation(() => ({ as: vi.fn() })),
  desc: vi.fn(),
  asc: vi.fn(),
  count: vi.fn(),
  sum: vi.fn(),
}));

import { GET, PUT, DELETE } from "./route";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const sampleCampaign = {
  id: "campaign-1",
  title: "Help Students",
  description: "A scholarship fund",
  category: "Scholarship",
  imageUrl: "donations/image.jpg",
  targetAmount: 10000000,
  currentAmount: 5000000,
  accountNumber: "1234567890",
  bankName: "BCA",
  accountName: "IAOS Fund",
  donationInstructions: "Transfer to account",
  beneficiaryCount: 10,
  createdAt: new Date(),
  totalRaised: 5000000,
  donorCount: 3,
};

function setupGetChains(campaign: Record<string, unknown> | null) {
  // For GET: 4 sequential db calls, each starting with select()
  // We use mockImplementation so each select() call returns a fresh chain
  mockDb.select.mockImplementation(() => ({
    from: vi.fn().mockImplementation(() => ({
      leftJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue(campaign ? [campaign] : []),
        }),
      }),
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    })),
  }));
}

describe("GET /api/donations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "admin" } });
    setupGetChains(sampleCampaign);
    mockGetImageProxyUrl.mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/donations/campaign-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, makeParams("campaign-1"))
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when campaign not found", async () => {
    setupGetChains(null);
    const req = createGetRequest("/api/donations/nonexistent");
    const { status, body } = await parseJsonResponse(
      await GET(req, makeParams("nonexistent"))
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Campaign not found");
  });

  it("returns campaign with all data on success", async () => {
    const req = createGetRequest("/api/donations/campaign-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, makeParams("campaign-1"))
    );
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data).toHaveProperty("recentTransactions");
    expect(body.data).toHaveProperty("reportImages");
    expect(body.data).toHaveProperty("reportTestimonies");
    expect(mockGetImageProxyUrl).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockDb.select.mockImplementation(() => {
      throw new Error("DB error");
    });
    const req = createGetRequest("/api/donations/campaign-1");
    const { status, body } = await parseJsonResponse(
      await GET(req, makeParams("campaign-1"))
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("PUT /api/donations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "admin" } });
    // Re-setup chains after clearAllMocks
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({
      leftJoin: mockDb.leftJoin,
      innerJoin: mockDb.innerJoin,
      where: mockDb.where,
    });
    mockDb.leftJoin.mockReturnValue({ where: mockDb.where });
    mockDb.innerJoin.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({
      groupBy: mockDb.groupBy,
      orderBy: mockDb.orderBy,
      limit: mockDb.limit,
      returning: mockDb.returning,
    });
    mockDb.groupBy.mockResolvedValue([]);
    mockDb.orderBy.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.returning.mockResolvedValue([
      { id: "campaign-1", title: "Updated Title" },
    ]);
    mockDb.delete.mockReturnValue({ where: mockDb.where });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPutRequest("/api/donations/campaign-1", {
      title: "Updated",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("campaign-1"))
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", role: "member" },
    });
    const req = createPutRequest("/api/donations/campaign-1", {
      title: "Updated",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("campaign-1"))
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when campaign not found", async () => {
    mockDb.returning.mockResolvedValueOnce([]);
    const req = createPutRequest("/api/donations/nonexistent", {
      title: "Updated",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("nonexistent"))
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Campaign not found");
  });

  it("updates campaign successfully", async () => {
    const req = createPutRequest("/api/donations/campaign-1", {
      title: "Updated Title",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("campaign-1"))
    );
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockDb.returning.mockRejectedValueOnce(new Error("DB error"));
    const req = createPutRequest("/api/donations/campaign-1", {
      title: "Updated",
    });
    const { status, body } = await parseJsonResponse(
      await PUT(req, makeParams("campaign-1"))
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("DELETE /api/donations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "admin" } });
    // For DELETE: first select images, then 3 deletes, then delete campaign with returning
    // Use mockImplementation to handle the sequence
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({
      leftJoin: mockDb.leftJoin,
      innerJoin: mockDb.innerJoin,
      where: mockDb.where,
    });
    mockDb.leftJoin.mockReturnValue({ where: mockDb.where });
    mockDb.innerJoin.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({
      groupBy: mockDb.groupBy,
      orderBy: mockDb.orderBy,
      limit: mockDb.limit,
      returning: mockDb.returning,
    });
    mockDb.groupBy.mockResolvedValue([]);
    mockDb.orderBy.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.delete.mockReturnValue({ where: mockDb.where });
    mockDb.returning.mockResolvedValue([{ id: "campaign-1" }]);
    mockDeleteFromS3.mockResolvedValue(undefined);
    mockGetImageProxyUrl.mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createDeleteRequest("/api/donations/campaign-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("campaign-1"))
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", role: "member" },
    });
    const req = createDeleteRequest("/api/donations/campaign-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("campaign-1"))
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("deletes campaign successfully", async () => {
    // select().from().where() -> resolves to [] (no images)
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    // 3x delete().where() resolves for associated records
    // final delete().where().returning() resolves with deleted campaign
    mockDb.delete
      .mockReturnValueOnce({ where: vi.fn().mockResolvedValue(undefined) }) // delete transactions
      .mockReturnValueOnce({ where: vi.fn().mockResolvedValue(undefined) }) // delete report images
      .mockReturnValueOnce({ where: vi.fn().mockResolvedValue(undefined) }) // delete report testimonies
      .mockReturnValueOnce({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "campaign-1" }]),
        }),
      }); // delete campaign with returning

    const req = createDeleteRequest("/api/donations/campaign-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("campaign-1"))
    );
    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true });
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    // select images throws
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    });
    const req = createDeleteRequest("/api/donations/campaign-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, makeParams("campaign-1"))
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
