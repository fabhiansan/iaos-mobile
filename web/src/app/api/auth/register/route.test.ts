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
  users: { id: "id", email: "email", nim: "nim" },
}));
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed_password") },
}));

import { POST } from "./route";

const validBody = {
  name: "John Doe",
  email: "john@example.com",
  password: "Password1",
  nim: "12345678",
  yearOfEntry: 2023,
  phone: "081234567890",
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup chains after clearAllMocks
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([]);
    mockDb.insert.mockReturnValue({ values: mockDb.values });
    mockDb.values.mockResolvedValue(undefined);
  });

  it("returns 400 when fields are missing", async () => {
    const req = createPostRequest("/api/auth/register", { name: "John" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("All fields are required");
  });

  it("returns 400 for invalid email format", async () => {
    const req = createPostRequest("/api/auth/register", { ...validBody, email: "not-email" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid email format");
  });

  it("returns 400 for weak password", async () => {
    const req = createPostRequest("/api/auth/register", { ...validBody, password: "weak" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toContain("Password must");
  });

  it("returns 400 for non-alphanumeric NIM", async () => {
    const req = createPostRequest("/api/auth/register", { ...validBody, nim: "123-456" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Student ID must be alphanumeric");
  });

  it("returns 400 for non-digit phone", async () => {
    const req = createPostRequest("/api/auth/register", { ...validBody, phone: "08123-abc" });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Phone number must contain only digits");
  });

  it("returns 400 for invalid year of entry", async () => {
    const req = createPostRequest("/api/auth/register", { ...validBody, yearOfEntry: 1800 });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid year of entry");
  });

  it("returns 400 for future year of entry", async () => {
    const req = createPostRequest("/api/auth/register", { ...validBody, yearOfEntry: 3000 });
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Invalid year of entry");
  });

  it("returns 409 when email or NIM already exists", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "existing-id" }]);
    const req = createPostRequest("/api/auth/register", validBody);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(409);
    expect(body.error).toBe("Email or Student ID already registered");
  });

  it("returns success on valid registration", async () => {
    const req = createPostRequest("/api/auth/register", validBody);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("DB connection failed"));
    const req = createPostRequest("/api/auth/register", validBody);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
