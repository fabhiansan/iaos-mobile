import { describe, it, expect, vi, beforeEach } from "vitest";
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
    resetToken: "resetToken",
    resetTokenExpires: "resetTokenExpires",
    passwordHash: "passwordHash",
    updatedAt: "updatedAt",
  },
}));
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("new_hashed_password") },
}));

import { POST } from "./route";

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
  });

  it("returns 400 when token or password is missing", async () => {
    const req = createPostRequest("/api/auth/reset-password", { token: "abc" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Token and password are required");
  });

  it("returns 400 for weak password", async () => {
    const req = createPostRequest("/api/auth/reset-password", { token: "abc", password: "weak" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toContain("Password must");
  });

  it("returns 400 for invalid or expired token", async () => {
    const req = createPostRequest("/api/auth/reset-password", { token: "invalidtoken", password: "Password1" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid or expired reset token");
  });

  it("resets password successfully with valid token", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "user-123" }]);
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockDb.set.mockReturnValue({ where: updateWhere });

    const req = createPostRequest("/api/auth/reset-password", { token: "validtoken", password: "NewPass1" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 400 when only password is provided without token", async () => {
    const req = createPostRequest("/api/auth/reset-password", { password: "Password1" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Token and password are required");
  });

  it("returns 500 on database error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB error"));
    const req = createPostRequest("/api/auth/reset-password", { token: "sometoken", password: "Password1" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
