import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPostRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth, mockBcrypt } = vi.hoisted(() => {
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
  return {
    mockDb: chain,
    mockAuth: fn(),
    mockBcrypt: {
      compare: fn(),
      hash: fn().mockResolvedValue("new_hashed_password"),
    },
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: { id: "id", passwordHash: "passwordHash", updatedAt: "updatedAt" },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("bcryptjs", () => ({ default: mockBcrypt }));

import { POST } from "./route";

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([{ id: "user-123", passwordHash: "old_hash" }]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockBcrypt.compare.mockResolvedValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPostRequest("/api/auth/change-password", {
      currentPassword: "OldPass1",
      newPassword: "NewPass1",
    });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session has no user id", async () => {
    mockAuth.mockResolvedValueOnce({ user: {} });
    const req = createPostRequest("/api/auth/change-password", {
      currentPassword: "OldPass1",
      newPassword: "NewPass1",
    });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when fields are missing", async () => {
    const req = createPostRequest("/api/auth/change-password", { currentPassword: "OldPass1" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Current password and new password are required");
  });

  it("returns 400 for weak new password", async () => {
    const req = createPostRequest("/api/auth/change-password", {
      currentPassword: "OldPass1",
      newPassword: "weak",
    });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toContain("Password must");
  });

  it("returns 404 when user is not found in DB", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createPostRequest("/api/auth/change-password", {
      currentPassword: "OldPass1",
      newPassword: "NewPass1",
    });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  it("returns 400 when current password is incorrect", async () => {
    mockBcrypt.compare.mockResolvedValueOnce(false);
    const req = createPostRequest("/api/auth/change-password", {
      currentPassword: "WrongPass1",
      newPassword: "NewPass1",
    });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Current password is incorrect");
  });

  it("changes password successfully", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockDb.set.mockReturnValue({ where: updateWhere });
    const req = createPostRequest("/api/auth/change-password", {
      currentPassword: "OldPass1",
      newPassword: "NewPass1",
    });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB error"));
    const req = createPostRequest("/api/auth/change-password", {
      currentPassword: "OldPass1",
      newPassword: "NewPass1",
    });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });

  it("hashes the new password before storing", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockDb.set.mockReturnValue({ where: updateWhere });
    const req = createPostRequest("/api/auth/change-password", {
      currentPassword: "OldPass1",
      newPassword: "NewPass1",
    });
    await POST(req);
    expect(mockBcrypt.hash).toHaveBeenCalledWith("NewPass1", 10);
  });
});
