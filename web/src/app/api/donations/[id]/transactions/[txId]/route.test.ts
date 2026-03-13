import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPatchRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    insert: fn(),
    values: fn(),
    returning: fn(),
    update: fn(),
    set: fn(),
  };
  // select().from().where()
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockResolvedValue([]);
  // update().set().where().returning()
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });
  chain.returning.mockResolvedValue([]);
  return {
    mockDb: chain,
    mockAuth: fn(),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  donationCampaigns: {
    id: "id",
    currentAmount: "currentAmount",
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
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  sql: vi.fn(),
}));

import { PATCH } from "./route";

const makeParams = (id: string, txId: string) => ({
  params: Promise.resolve({ id, txId }),
});

describe("PATCH /api/donations/[id]/transactions/[txId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123", role: "admin" } });
    // Re-setup chains after clearAllMocks
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.returning.mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPatchRequest("/api/donations/c1/transactions/tx1", {
      status: "verified",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, makeParams("c1", "tx1"))
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-123", role: "member" },
    });
    const req = createPatchRequest("/api/donations/c1/transactions/tx1", {
      status: "verified",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, makeParams("c1", "tx1"))
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 for invalid status", async () => {
    const req = createPatchRequest("/api/donations/c1/transactions/tx1", {
      status: "invalid",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, makeParams("c1", "tx1"))
    );
    expect(status).toBe(400);
    expect(body.error).toBe("Status must be 'verified' or 'rejected'");
  });

  it("returns 404 when transaction not found", async () => {
    // select().from().where() resolves to empty array
    mockDb.where.mockResolvedValueOnce([]);
    const req = createPatchRequest("/api/donations/c1/transactions/tx1", {
      status: "verified",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, makeParams("c1", "tx1"))
    );
    expect(status).toBe(404);
    expect(body.error).toBe("Transaction not found");
  });

  it("verifies transaction and adds to campaign amount", async () => {
    const transaction = {
      id: "tx1",
      campaignId: "c1",
      donorId: "user-456",
      amount: 500000,
      status: "pending",
    };
    const updatedTransaction = { ...transaction, status: "verified", verifiedAt: new Date() };

    // select().from().where() -> find transaction
    mockDb.where
      .mockResolvedValueOnce([transaction]) // find transaction
      .mockReturnValueOnce({ returning: mockDb.returning }) // update transaction set().where()
      .mockResolvedValueOnce(undefined); // update campaign amount set().where()

    mockDb.returning.mockResolvedValueOnce([updatedTransaction]);

    const req = createPatchRequest("/api/donations/c1/transactions/tx1", {
      status: "verified",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, makeParams("c1", "tx1"))
    );
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.status).toBe("verified");
    // update called twice: once for transaction, once for campaign amount
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });

  it("rejects verified transaction and subtracts from campaign amount", async () => {
    const transaction = {
      id: "tx1",
      campaignId: "c1",
      donorId: "user-456",
      amount: 500000,
      status: "verified",
    };
    const updatedTransaction = { ...transaction, status: "rejected", verifiedAt: null };

    // select().from().where() -> find transaction
    mockDb.where
      .mockResolvedValueOnce([transaction]) // find transaction
      .mockReturnValueOnce({ returning: mockDb.returning }) // update transaction set().where()
      .mockResolvedValueOnce(undefined); // update campaign amount set().where()

    mockDb.returning.mockResolvedValueOnce([updatedTransaction]);

    const req = createPatchRequest("/api/donations/c1/transactions/tx1", {
      status: "rejected",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, makeParams("c1", "tx1"))
    );
    expect(status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.status).toBe("rejected");
    // update called twice: once for transaction, once for campaign amount
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });

  it("returns 500 on error", async () => {
    mockDb.where.mockRejectedValueOnce(new Error("DB error"));
    const req = createPatchRequest("/api/donations/c1/transactions/tx1", {
      status: "verified",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, makeParams("c1", "tx1"))
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
