import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPutRequest, parseJsonResponse } from "@/test/helpers";

const { mockDb, mockAuth, mockS3 } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain = {
    select: fn(),
    from: fn(),
    where: fn(),
    limit: fn(),
    update: fn(),
    set: fn(),
  };
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit });
  chain.limit.mockResolvedValue([]);
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });
  return {
    mockDb: chain,
    mockAuth: fn(),
    mockS3: {
      getImageProxyUrl: fn().mockImplementation((key: string | null) =>
        key ? `/api/images/${encodeURIComponent(key)}` : null
      ),
    },
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/db/schema", () => ({
  users: {
    id: "id",
    name: "name",
    email: "email",
    nim: "nim",
    yearOfEntry: "yearOfEntry",
    phone: "phone",
    role: "role",
    emailVerified: "emailVerified",
    profileImageUrl: "profileImageUrl",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  jobs: {
    postedById: "postedById",
    status: "status",
  },
  donationTransactions: {
    donorId: "donorId",
    status: "status",
    amount: "amount",
  },
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/s3", () => mockS3);
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(),
  sql: vi.fn(),
}));

import { GET, PUT } from "./route";

const mockUser = {
  id: "user-123",
  name: "John Doe",
  email: "john@example.com",
  nim: "12345678",
  yearOfEntry: 2023,
  phone: "081234567890",
  role: "user",
  emailVerified: true,
  profileImageUrl: "profiles/user-123/photo.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([mockUser]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockS3.getImageProxyUrl.mockImplementation((key: string | null) =>
      key ? `/api/images/${encodeURIComponent(key)}` : null
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when user not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  it("returns profile with proxy URL on success", async () => {
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.id).toBe("user-123");
    expect(data.name).toBe("John Doe");
    expect(data.profileImageUrl).toBe(
      `/api/images/${encodeURIComponent("profiles/user-123/photo.jpg")}`
    );
    expect(mockS3.getImageProxyUrl).toHaveBeenCalledWith(
      "profiles/user-123/photo.jpg"
    );
  });

  it("returns profile with null proxy URL when no profileImageUrl", async () => {
    const userWithoutImage = { ...mockUser, profileImageUrl: null };
    mockDb.limit.mockResolvedValueOnce([userWithoutImage]);
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.profileImageUrl).toBeNull();
  });

  it("returns 500 on error", async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    const { status, body } = await parseJsonResponse(await GET());
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("PUT /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([mockUser]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = createPutRequest("/api/profile", {
      name: "Jane Doe",
      phone: "081234567890",
      yearOfEntry: 2023,
    });
    const { status, body } = await parseJsonResponse(await PUT(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for empty name", async () => {
    const req = createPutRequest("/api/profile", {
      name: "",
      phone: "081234567890",
      yearOfEntry: 2023,
    });
    const { status, body } = await parseJsonResponse(await PUT(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Name must be a non-empty string");
  });

  it("returns 400 for empty phone", async () => {
    const req = createPutRequest("/api/profile", {
      name: "Jane Doe",
      phone: "",
      yearOfEntry: 2023,
    });
    const { status, body } = await parseJsonResponse(await PUT(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Phone must be a non-empty string");
  });

  it("returns 400 for invalid yearOfEntry", async () => {
    const req = createPutRequest("/api/profile", {
      name: "Jane Doe",
      phone: "081234567890",
      yearOfEntry: 1800,
    });
    const { status, body } = await parseJsonResponse(await PUT(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Year of entry must be a valid year");
  });

  it("updates profile successfully", async () => {
    const updatedUser = { ...mockUser, name: "Jane Doe" };
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockDb.set.mockReturnValueOnce({ where: updateWhere });
    mockDb.limit.mockResolvedValueOnce([updatedUser]);

    const req = createPutRequest("/api/profile", {
      name: "Jane Doe",
      phone: "081234567890",
      yearOfEntry: 2023,
    });
    const { status, body } = await parseJsonResponse(await PUT(req));
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.name).toBe("Jane Doe");
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockAuth.mockRejectedValueOnce(new Error("Auth error"));
    const req = createPutRequest("/api/profile", {
      name: "Jane Doe",
      phone: "081234567890",
      yearOfEntry: 2023,
    });
    const { status, body } = await parseJsonResponse(await PUT(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
