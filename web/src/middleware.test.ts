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

  describe("unauthenticated users", () => {
    it.each(["/", "/login", "/register", "/forgot-password", "/reset-password"])(
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

    it("redirects from /dashboard to /login", () => {
      const res = middlewareCallback(createRequest("/dashboard"));
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("redirects from /profile to /login", () => {
      const res = middlewareCallback(createRequest("/profile"));
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("redirects from /profile/change-password to /login", () => {
      const res = middlewareCallback(createRequest("/profile/change-password"));
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toBe("http://localhost:3000/login");
    });
  });

  describe("authenticated users with complete profile", () => {
    const auth = { user: { id: "1", profileComplete: true } };

    it("allows /dashboard", () => {
      const res = middlewareCallback(createRequest("/dashboard", auth));
      expect(res?.headers.get("location")).toBeNull();
    });

    it("allows /profile", () => {
      const res = middlewareCallback(createRequest("/profile", auth));
      expect(res?.headers.get("location")).toBeNull();
    });

    it("allows /news", () => {
      const res = middlewareCallback(createRequest("/news", auth));
      expect(res?.headers.get("location")).toBeNull();
    });

    it.each(["/", "/login", "/register"])(
      "redirects from %s to /news",
      (path) => {
        const res = middlewareCallback(createRequest(path, auth));
        expect(res?.status).toBe(307);
        expect(res?.headers.get("location")).toBe("http://localhost:3000/news");
      }
    );
  });

  describe("authenticated users with incomplete profile", () => {
    const auth = { user: { id: "1", profileComplete: false } };

    it.each(["/", "/login", "/news", "/dashboard"])(
      "redirects from %s to /complete-profile",
      (path) => {
        const res = middlewareCallback(createRequest(path, auth));
        expect(res?.status).toBe(307);
        expect(res?.headers.get("location")).toBe(
          "http://localhost:3000/complete-profile"
        );
      }
    );

    it("allows /complete-profile", () => {
      const res = middlewareCallback(createRequest("/complete-profile", auth));
      expect(res?.headers.get("location")).toBeNull();
    });
  });

  describe("admin route protection", () => {
    it("redirects non-admin from /admin to /news", () => {
      const res = middlewareCallback(
        createRequest("/admin", { user: { id: "1", role: "user", profileComplete: true } })
      );
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toBe("http://localhost:3000/news");
    });

    it("allows admin to access /admin", () => {
      const res = middlewareCallback(
        createRequest("/admin", { user: { id: "1", role: "admin", profileComplete: true } })
      );
      expect(res?.headers.get("location")).toBeNull();
    });
  });
});
