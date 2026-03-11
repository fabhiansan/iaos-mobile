import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Capture the callback passed to auth()
let middlewareCallback: (req: { auth: unknown; nextUrl: URL }) => ReturnType<typeof NextResponse.next> | ReturnType<typeof NextResponse.redirect>;

vi.mock("@/lib/auth", () => ({
  auth: (cb: typeof middlewareCallback) => {
    middlewareCallback = cb;
    return cb;
  },
}));

// Import after mocking to capture the callback
await import("./middleware");

function createRequest(pathname: string, auth: unknown = null) {
  const url = new URL(pathname, "http://localhost:3000");
  return { auth, nextUrl: url };
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("public routes pass through", () => {
    it.each(["/login", "/register", "/forgot-password", "/reset-password"])(
      "allows %s without auth",
      (path) => {
        const res = middlewareCallback(createRequest(path));
        expect(res?.headers.get("location")).toBeNull();
      }
    );

    it("allows nested public route /reset-password?token=abc", () => {
      const res = middlewareCallback(createRequest("/reset-password?token=abc"));
      expect(res?.headers.get("location")).toBeNull();
    });
  });

  it("allows root path without auth", () => {
    const res = middlewareCallback(createRequest("/"));
    expect(res?.headers.get("location")).toBeNull();
  });

  describe("protected routes", () => {
    it("redirects unauthenticated user from /dashboard to /login", () => {
      const res = middlewareCallback(createRequest("/dashboard"));
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("redirects unauthenticated user from /profile to /login", () => {
      const res = middlewareCallback(createRequest("/profile"));
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("redirects unauthenticated user from /profile/change-password to /login", () => {
      const res = middlewareCallback(createRequest("/profile/change-password"));
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toBe("http://localhost:3000/login");
    });
  });

  describe("authenticated users", () => {
    it("allows authenticated user to access /dashboard", () => {
      const res = middlewareCallback(
        createRequest("/dashboard", { user: { id: "1" } })
      );
      expect(res?.headers.get("location")).toBeNull();
    });

    it("allows authenticated user to access /profile", () => {
      const res = middlewareCallback(
        createRequest("/profile", { user: { id: "1" } })
      );
      expect(res?.headers.get("location")).toBeNull();
    });
  });
});
