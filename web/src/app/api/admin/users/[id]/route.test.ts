import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGetRequest,
  createPatchRequest,
  createDeleteRequest,
  parseJsonResponse,
} from "@/test/helpers";

const { mockDb, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    update: fn(),
    set: fn(),
    delete: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit });
  chain.limit.mockResolvedValue([]);
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });
  chain.delete.mockReturnValue({ where: chain.where });
  return {
    mockDb: chain,
    mockAuth: fn(),
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: { id: "id", name: "name", email: "email", role: "role" },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("../columns", () => ({
  safeUserColumns: { id: "id", name: "name", email: "email" },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  ilike: vi.fn(),
  desc: vi.fn(),
  count: vi.fn(),
  sum: vi.fn(),
}));

import { GET, PATCH, DELETE } from "./route";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });
const mockUser = { id: "user-2", name: "Alice", email: "alice@test.com" };

describe("GET /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([mockUser]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.delete.mockReturnValue({ where: mockDb.where });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createGetRequest("/api/admin/users/user-2");
    const { status, body } = await parseJsonResponse(
      await GET(req, mockParams("user-2")),
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const req = createGetRequest("/api/admin/users/user-2");
    const { status, body } = await parseJsonResponse(
      await GET(req, mockParams("user-2")),
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when user not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createGetRequest("/api/admin/users/nonexistent");
    const { status, body } = await parseJsonResponse(
      await GET(req, mockParams("nonexistent")),
    );
    expect(status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  it("returns user on success", async () => {
    const req = createGetRequest("/api/admin/users/user-2");
    const { status, body } = await parseJsonResponse(
      await GET(req, mockParams("user-2")),
    );
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.id).toBe("user-2");
    expect(data.name).toBe("Alice");
  });
});

describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([mockUser]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.delete.mockReturnValue({ where: mockDb.where });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPatchRequest("/api/admin/users/user-2", {
      role: "admin",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("user-2")),
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const req = createPatchRequest("/api/admin/users/user-2", {
      role: "admin",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("user-2")),
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when trying to change own role", async () => {
    const req = createPatchRequest("/api/admin/users/admin-1", {
      role: "user",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("admin-1")),
    );
    expect(status).toBe(400);
    expect(body.error).toBe("Cannot change your own role");
  });

  it("returns 400 for invalid role", async () => {
    const req = createPatchRequest("/api/admin/users/user-2", {
      role: "superadmin",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("user-2")),
    );
    expect(status).toBe(400);
    expect(body.error).toBe("Role must be 'admin' or 'user'");
  });

  it("returns 404 when user not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createPatchRequest("/api/admin/users/nonexistent", {
      role: "admin",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("nonexistent")),
    );
    expect(status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  it("updates user role successfully", async () => {
    const updatedUser = { ...mockUser, role: "admin" };
    // First limit call: check existing user → found
    // After update, where returns { limit } for the re-fetch
    // Second limit call: re-fetch updated user
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockDb.set.mockReturnValueOnce({ where: updateWhere });
    mockDb.limit
      .mockResolvedValueOnce([{ id: "user-2" }]) // existing check
      .mockResolvedValueOnce([updatedUser]); // re-fetch

    const req = createPatchRequest("/api/admin/users/user-2", {
      role: "admin",
    });
    const { status, body } = await parseJsonResponse(
      await PATCH(req, mockParams("user-2")),
    );
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.id).toBe("user-2");
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([mockUser]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockDb.delete.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockResolvedValue(undefined);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createDeleteRequest("/api/admin/users/user-2");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("user-2")),
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when not admin", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "user" } });
    const req = createDeleteRequest("/api/admin/users/user-2");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("user-2")),
    );
    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when trying to delete own account", async () => {
    const req = createDeleteRequest("/api/admin/users/admin-1");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("admin-1")),
    );
    expect(status).toBe(400);
    expect(body.error).toBe("Cannot delete your own account");
  });

  it("returns 404 when user not found", async () => {
    mockDb.where.mockReturnValueOnce({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValueOnce([]);
    const req = createDeleteRequest("/api/admin/users/nonexistent");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("nonexistent")),
    );
    expect(status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  it("deletes user successfully", async () => {
    // select check: where → { limit }, limit → [{ id }]
    mockDb.where
      .mockReturnValueOnce({ limit: mockDb.limit }) // select chain
      .mockResolvedValueOnce(undefined); // delete chain
    mockDb.limit.mockResolvedValueOnce([{ id: "user-2" }]);

    const req = createDeleteRequest("/api/admin/users/user-2");
    const { status, body } = await parseJsonResponse(
      await DELETE(req, mockParams("user-2")),
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
