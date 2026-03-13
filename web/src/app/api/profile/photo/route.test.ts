import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { parseJsonResponse } from "@/test/helpers";

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
      uploadToS3: fn().mockResolvedValue(undefined),
      deleteFromS3: fn().mockResolvedValue(undefined),
      getS3Key: fn().mockReturnValue("profiles/user-123/test.jpg"),
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
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/s3", () => mockS3);
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

import { POST, DELETE } from "./route";

function createFormDataRequest(url: string, formData: FormData) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/profile/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([{ profileImageUrl: "old-key.jpg" }]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockS3.uploadToS3.mockResolvedValue(undefined);
    mockS3.deleteFromS3.mockResolvedValue(undefined);
    mockS3.getS3Key.mockReturnValue("profiles/user-123/test.jpg");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.append("file", new File(["test"], "photo.jpg", { type: "image/jpeg" }));
    const req = createFormDataRequest("/api/profile/photo", formData);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when no file provided", async () => {
    const formData = new FormData();
    const req = createFormDataRequest("/api/profile/photo", formData);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("No file provided");
  });

  it("returns 400 for invalid file type", async () => {
    const formData = new FormData();
    formData.append("file", new File(["test"], "doc.pdf", { type: "application/pdf" }));
    const req = createFormDataRequest("/api/profile/photo", formData);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("File must be an image (JPEG, PNG, WebP, or GIF)");
  });

  it("returns 400 for file over 5MB", async () => {
    const formData = new FormData();
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.jpg", {
      type: "image/jpeg",
    });
    formData.append("file", bigFile);
    const req = createFormDataRequest("/api/profile/photo", formData);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(400);
    expect(body.error).toBe("File size must be less than 5MB");
  });

  it("uploads photo and updates profile successfully", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockDb.set.mockReturnValue({ where: updateWhere });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["test"], "photo.jpg", { type: "image/jpeg" })
    );
    const req = createFormDataRequest("/api/profile/photo", formData);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.profileImageUrl).toBe("profiles/user-123/test.jpg");
    expect(mockS3.uploadToS3).toHaveBeenCalled();
    expect(mockS3.deleteFromS3).toHaveBeenCalledWith("old-key.jpg");
  });

  it("returns 500 on error", async () => {
    mockAuth.mockRejectedValueOnce(new Error("Auth error"));
    const formData = new FormData();
    formData.append(
      "file",
      new File(["test"], "photo.jpg", { type: "image/jpeg" })
    );
    const req = createFormDataRequest("/api/profile/photo", formData);
    const { status, body } = await parseJsonResponse(await POST(req));
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

describe("DELETE /api/profile/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockDb.select.mockReturnValue({ from: mockDb.from });
    mockDb.from.mockReturnValue({ where: mockDb.where });
    mockDb.where.mockReturnValue({ limit: mockDb.limit });
    mockDb.limit.mockResolvedValue([{ profileImageUrl: "old-key.jpg" }]);
    mockDb.update.mockReturnValue({ set: mockDb.set });
    mockDb.set.mockReturnValue({ where: mockDb.where });
    mockS3.deleteFromS3.mockResolvedValue(undefined);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { status, body } = await parseJsonResponse(await DELETE());
    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("deletes photo successfully", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    mockDb.set.mockReturnValue({ where: updateWhere });

    const { status, body } = await parseJsonResponse(await DELETE());
    expect(status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.profileImageUrl).toBeNull();
    expect(mockS3.deleteFromS3).toHaveBeenCalledWith("old-key.jpg");
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mockAuth.mockRejectedValueOnce(new Error("Auth error"));
    const { status, body } = await parseJsonResponse(await DELETE());
    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
