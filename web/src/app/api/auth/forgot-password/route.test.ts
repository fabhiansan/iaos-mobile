import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { createPostRequest, parseJsonResponse } from "@/test/helpers";

const mockDb = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    insert: fn(),
    update: fn(),
    from: fn(),
    where: fn(),
    set: fn(),
    values: fn(),
    limit: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit });
  chain.limit.mockResolvedValue([]);
  chain.insert.mockReturnValue({ values: chain.values });
  chain.values.mockResolvedValue(undefined);
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });
  return chain;
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: {
    id: "id",
    email: "email",
    resetToken: "resetToken",
    resetTokenExpires: "resetTokenExpires",
    updatedAt: "updatedAt",
  },
}));

import { POST } from "./route";

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
  });

  it("returns 400 when email is missing", async () => {
    const req = createPostRequest("/api/auth/forgot-password", {});
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Email is required");
  });

  it("returns success even when user does not exist", async () => {
    const req = createPostRequest("/api/auth/forgot-password", { email: "nobody@example.com" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("generates token and updates DB when user exists", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "user-123" }]);
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockDb.set.mockReturnValue({ where: updateWhere });

    const spy = vi.spyOn(crypto, "randomBytes");
    const req = createPostRequest("/api/auth/forgot-password", { email: "user@example.com" });
    const { status, body } = await parseJsonResponse(await POST(req));

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(spy).toHaveBeenCalledWith(32);
    expect(mockDb.update).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("always returns same response shape for existing and non-existing emails", async () => {
    const req1 = createPostRequest("/api/auth/forgot-password", { email: "a@b.com" });
    const res1 = await parseJsonResponse(await POST(req1));

    vi.clearAllMocks();
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValueOnce([{ id: "user-1" }]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

    const req2 = createPostRequest("/api/auth/forgot-password", { email: "c@d.com" });
    const res2 = await parseJsonResponse(await POST(req2));

    expect(res1.status).toBe(res2.status);
    expect(res1.body).toEqual(res2.body);
  });

  it("returns 500 on database error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB error"));
    const req = createPostRequest("/api/auth/forgot-password", { email: "user@example.com" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
