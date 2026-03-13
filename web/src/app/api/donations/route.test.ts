import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPostRequest,
  createGetRequest,
  parseJsonResponse,
} from "@/test/helpers";

const { mockDb, mockAuth, mockGetImageProxyUrl } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    offset: fn(),
    leftJoin: fn(),
    groupBy: fn(),
    orderBy: fn(),
    insert: fn(),
    values: fn(),
    returning: fn(),
  };
  // select().from().leftJoin().where().groupBy().orderBy().limit().offset()
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ leftJoin: chain.leftJoin, where: chain.where });
  chain.leftJoin.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ groupBy: chain.groupBy });
  chain.groupBy.mockReturnValue({ orderBy: chain.orderBy });
  chain.orderBy.mockReturnValue({ limit: chain.limit });
  chain.limit.mockReturnValue({ offset: chain.offset });
  chain.offset.mockResolvedValue([]);
  // insert().values().returning()
  chain.insert.mockReturnValue({ values: chain.values });
  chain.values.mockReturnValue({ returning: chain.returning });
  chain.returning.mockResolvedValue([{ id: "campaign-1" }]);
  return {
    mockDb: chain,
    mockAuth: fn(),
    mockGetImageProxyUrl: fn().mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    ),
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
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/s3", () => ({ getImageProxyUrl: mockGetImageProxyUrl }));
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

import { GET, POST } from "./route";

const validCampaign = {
  title: "Help Students",
  description: "A scholarship fund",
  category: "Scholarship",
  targetAmount: 10000000,
  accountNumber: "1234567890",
  bankName: "BCA",
  accountName: "IAOS Fund",
};

describe("GET /api/donations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "member" } });
    // Re-setup chains after clearAllMocks
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({
      leftJoin: mockDb.leftJoin,
      where: mockDb.where,
    });
    mockDb.leftJoin.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ groupBy: mockDb.groupBy });
    mockDb.groupBy.mockReturnValue({ orderBy: mockDb.orderBy });
    mockDb.orderBy.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockReturnValue({ offset: mockDb.offset });
    mockDb.offset.mockResolvedValue([]);
    mockDb.insert.mockReturnValue({ values: mockDb.values });
    mockDb.values.mockReturnValue({ returning: mockDb.returning });
    mockDb.returning.mockResolvedValue([{ id: "campaign-1" }]);
    mockGetImageProxyUrl.mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/donations");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns campaigns on success", async () => {
    const campaignData = [
      {
        id: "c1",
        title: "Help Students",
        description: "A scholarship fund",
        category: "Scholarship",
        imageUrl: "donations/image.jpg",
        targetAmount: 10000000,
        currentAmount: 0,
        accountNumber: "1234567890",
        bankName: "BCA",
        accountName: "IAOS Fund",
        beneficiaryCount: 0,
        createdAt: new Date(),
        totalRaised: 0,
        donorCount: 0,
      },
    ];
    // First select chain: count query via from().where() resolves directly
    mockDb.where
      .mockResolvedValueOnce([{ value: 5 }]) // count query
      .mockReturnValueOnce({ groupBy: mockDb.groupBy }); // data query
    mockDb.offset.mockResolvedValueOnce(campaignData);

    const req = createGetRequest("/api/donations");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(5);
    expect(mockGetImageProxyUrl).toHaveBeenCalledWith("donations/image.jpg");
  });

  it("returns 500 on error", async () => {
    mockDb.where.mockRejectedValueOnce(new Error("DB error"));
    const req = createGetRequest("/api/donations");
    const { status, body } = await parseJsonResponse(await GET(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("POST /api/donations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({
      leftJoin: mockDb.leftJoin,
      where: mockDb.where,
    });
    mockDb.leftJoin.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ groupBy: mockDb.groupBy });
    mockDb.groupBy.mockReturnValue({ orderBy: mockDb.orderBy });
    mockDb.orderBy.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockReturnValue({ offset: mockDb.offset });
    mockDb.offset.mockResolvedValue([]);
    mockDb.insert.mockReturnValue({ values: mockDb.values });
    mockDb.values.mockReturnValue({ returning: mockDb.returning });
    mockDb.returning.mockResolvedValue([{ id: "campaign-1", ...validCampaign }]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPostRequest("/api/donations", validCampaign);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", role: "member" },
    });
    const req = createPostRequest("/api/donations", validCampaign);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when missing required fields", async () => {
    const req = createPostRequest("/api/donations", { title: "Only title" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Missing required fields");
  });

  it("creates campaign successfully", async () => {
    const req = createPostRequest("/api/donations", validCampaign);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(201);
    expect(body.data).toBeDefined();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockDb.returning.mockRejectedValueOnce(new Error("DB error"));
    const req = createPostRequest("/api/donations", validCampaign);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
