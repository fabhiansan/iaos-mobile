# Auth System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement email/password authentication with JWT sessions for IAOS Connect using NextAuth.js v5, Drizzle ORM, and PostgreSQL.

**Architecture:** Next.js App Router API routes handle all auth logic. NextAuth.js v5 manages JWT session lifecycle. Drizzle ORM connects to the existing AWS RDS PostgreSQL database. Middleware protects all routes except auth pages.

**Tech Stack:** Next.js 16, NextAuth.js v5 (Auth.js), Drizzle ORM, PostgreSQL (node-postgres), bcrypt

**Spec:** `docs/superpowers/specs/2026-03-11-auth-system-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `web/src/db/index.ts` | Drizzle client instance (singleton) |
| `web/src/db/schema/users.ts` | Users table schema definition |
| `web/src/db/schema/index.ts` | Schema barrel export |
| `web/drizzle.config.ts` | Drizzle Kit configuration |
| `web/src/lib/auth.ts` | NextAuth v5 config (providers, callbacks) |
| `web/src/lib/auth-utils.ts` | Password validation utility |
| `web/src/app/api/auth/[...nextauth]/route.ts` | NextAuth route handler |
| `web/src/app/api/auth/register/route.ts` | Registration endpoint |
| `web/src/app/api/auth/forgot-password/route.ts` | Forgot password endpoint |
| `web/src/app/api/auth/reset-password/route.ts` | Reset password endpoint |
| `web/src/app/api/auth/change-password/route.ts` | Change password endpoint |
| `web/src/middleware.ts` | Route protection middleware |
| `web/src/app/providers.tsx` | SessionProvider wrapper component |
| `web/src/app/layout.tsx` | Modified: wrap children with SessionProvider |
| `web/src/app/page.tsx` | Modified: wire login form to signIn() |
| `web/src/app/login/page.tsx` | Modified: wire login form to signIn() |
| `web/src/app/register/page.tsx` | Modified: wire form to register API |
| `web/src/app/forgot-password/page.tsx` | Modified: wire form to forgot-password API |
| `web/src/app/reset-password/page.tsx` | Modified: read token from URL, wire form |
| `web/src/app/profile/change-password/page.tsx` | Modified: wire form to change-password API |

---

## Chunk 1: Dependencies & Database Setup

### Task 1: Install Dependencies

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install production dependencies**

```bash
cd web && pnpm add next-auth@beta drizzle-orm pg bcrypt
```

- [ ] **Step 2: Install dev dependencies**

```bash
cd web && pnpm add -D drizzle-kit @types/pg @types/bcrypt
```

- [ ] **Step 3: Verify installation**

Run: `cd web && pnpm ls next-auth drizzle-orm pg bcrypt drizzle-kit`
Expected: All packages listed with versions

- [ ] **Step 4: Commit**

```bash
git add web/package.json web/pnpm-lock.yaml
git commit -m "feat(auth): add auth dependencies (next-auth, drizzle-orm, pg, bcrypt)"
```

---

### Task 2: Create Drizzle Schema & Client

**Files:**
- Create: `web/src/db/schema/users.ts`
- Create: `web/src/db/schema/index.ts`
- Create: `web/src/db/index.ts`
- Create: `web/drizzle.config.ts`

- [ ] **Step 1: Create the users schema**

Create `web/src/db/schema/users.ts`:

```typescript
import { pgTable, pgEnum, uuid, varchar, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  nim: varchar("nim", { length: 20 }).notNull().unique(),
  yearOfEntry: integer("year_of_entry").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  role: roleEnum("role").default("user").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  profileImageUrl: text("profile_image_url"),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Create schema barrel export**

Create `web/src/db/schema/index.ts`:

```typescript
export * from "./users";
```

- [ ] **Step 3: Create the Drizzle client**

Create `web/src/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

- [ ] **Step 4: Create Drizzle Kit config**

Create `web/drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 5: Add database scripts to package.json**

Add to `web/package.json` scripts:

```json
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 6: Create .env.local in web/ directory**

Create `web/.env.local` with placeholder values:

```
DATABASE_URL=postgresql://user:password@localhost:5432/iaos_mobile
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

Note: User must fill in actual `DATABASE_URL` with the real AWS RDS connection string from the root `.env.local`. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`. Do NOT commit this file. Ensure `web/.env.local` is in `.gitignore`.

- [ ] **Step 7: Push schema to database**

Run: `cd web && pnpm db:push`
Expected: Table `users` created in PostgreSQL with all columns

- [ ] **Step 8: Commit**

```bash
git add web/src/db/ web/drizzle.config.ts web/package.json
git commit -m "feat(auth): add Drizzle ORM schema and database client"
```

---

## Chunk 2: NextAuth Configuration

### Task 3: Create Password Utility

**Files:**
- Create: `web/src/lib/auth-utils.ts`

- [ ] **Step 1: Create password validation utility**

Create `web/src/lib/auth-utils.ts`:

```typescript
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one digit" };
  }
  return { valid: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/auth-utils.ts
git commit -m "feat(auth): add password validation utility"
```

---

### Task 4: Configure NextAuth.js v5

**Files:**
- Create: `web/src/lib/auth.ts`
- Create: `web/src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create NextAuth config**

Create `web/src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
```

Note: Add `import type { DefaultSession } from "next-auth";` at the top of the file alongside the other imports.

- [ ] **Step 2: Create NextAuth route handler**

Create `web/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: No errors related to auth files (there may be other pre-existing errors)

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/auth.ts web/src/app/api/auth/\[...nextauth\]/route.ts
git commit -m "feat(auth): configure NextAuth.js v5 with credentials provider and JWT"
```

---

## Chunk 3: Auth API Endpoints

### Task 5: Registration Endpoint

**Files:**
- Create: `web/src/app/api/auth/register/route.ts`

- [ ] **Step 1: Create register route**

Create `web/src/app/api/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { validatePassword } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, nim, yearOfEntry, phone } = body;

    // Validate required fields
    if (!name || !email || !password || !nim || !yearOfEntry || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
        { status: 400 }
      );
    }

    // Validate NIM (alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(nim)) {
      return NextResponse.json(
        { error: "Student ID must be alphanumeric" },
        { status: 400 }
      );
    }

    // Validate phone (digits only)
    if (!/^\d+$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone number must contain only digits" },
        { status: 400 }
      );
    }

    // Validate year of entry
    const currentYear = new Date().getFullYear();
    if (yearOfEntry < 1950 || yearOfEntry > currentYear) {
      return NextResponse.json(
        { error: "Invalid year of entry" },
        { status: 400 }
      );
    }

    // Check if email or NIM already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.nim, nim)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Email or Student ID already registered" },
        { status: 409 }
      );
    }

    // Hash password and insert
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      email,
      passwordHash,
      nim,
      yearOfEntry,
      phone,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/api/auth/register/route.ts
git commit -m "feat(auth): add registration API endpoint"
```

---

### Task 6: Forgot Password Endpoint

**Files:**
- Create: `web/src/app/api/auth/forgot-password/route.ts`

- [ ] **Step 1: Create forgot-password route**

Create `web/src/app/api/auth/forgot-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return success to avoid leaking email existence
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(users)
        .set({
          resetToken: hashedToken,
          resetTokenExpires: expires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Log reset link for development (wire email service later)
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
      console.log(`\n🔑 Password reset link for ${email}:\n${resetUrl}\n`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/api/auth/forgot-password/route.ts
git commit -m "feat(auth): add forgot-password API endpoint"
```

---

### Task 7: Reset Password Endpoint

**Files:**
- Create: `web/src/app/api/auth/reset-password/route.ts`

- [ ] **Step 1: Create reset-password route**

Create `web/src/app/api/auth/reset-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { validatePassword } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
        { status: 400 }
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.resetToken, hashedToken),
          gt(users.resetTokenExpires, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/api/auth/reset-password/route.ts
git commit -m "feat(auth): add reset-password API endpoint"
```

---

### Task 8: Change Password Endpoint

**Files:**
- Create: `web/src/app/api/auth/change-password/route.ts`

- [ ] **Step 1: Create change-password route**

Create `web/src/app/api/auth/change-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { validatePassword } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/api/auth/change-password/route.ts
git commit -m "feat(auth): add change-password API endpoint"
```

---

## Chunk 4: Middleware, Providers & Frontend Wiring

### Task 9: Route Protection Middleware

**Files:**
- Create: `web/src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `web/src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow the root splash/login page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Check auth
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
```

Note: API routes (`/api/*`) are excluded from middleware. API route protection is handled at the route level via `auth()` calls (e.g., in the change-password endpoint). This is intentional — NextAuth's own routes under `/api/auth/` must not be blocked by middleware.

- [ ] **Step 2: Commit**

```bash
git add web/src/middleware.ts
git commit -m "feat(auth): add route protection middleware"
```

---

### Task 10: SessionProvider Setup

**Files:**
- Create: `web/src/app/providers.tsx`
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Create providers component**

Create `web/src/app/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 2: Wrap layout with Providers**

In `web/src/app/layout.tsx`, import and wrap `{children}` with `<Providers>`:

Add import at top:
```typescript
import { Providers } from "./providers";
```

Change the body content from:
```tsx
{children}
```
to:
```tsx
<Providers>{children}</Providers>
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/providers.tsx web/src/app/layout.tsx
git commit -m "feat(auth): add SessionProvider to app layout"
```

---

### Task 11: Wire Login Pages (page.tsx and login/page.tsx)

**Files:**
- Modify: `web/src/app/page.tsx`
- Modify: `web/src/app/login/page.tsx`

Both pages have identical login forms. The wiring is the same for both:

- [ ] **Step 1: Wire the splash page (page.tsx)**

In `web/src/app/page.tsx`:

1. Add imports:
```typescript
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
```

2. Add state for loading and error inside the component:
```typescript
const router = useRouter();
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState("");
```

3. Add login handler:
```typescript
const handleLogin = async () => {
  setIsLoading(true);
  setError("");
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/news");
    }
  } catch {
    setError("Something went wrong");
  } finally {
    setIsLoading(false);
  }
};
```

4. Connect the "Login" button's `onClick` to `handleLogin`
5. Display `error` state as error text below the form
6. Disable the login button and show loading state when `isLoading` is true
7. Disable Google/Apple buttons or add "Coming soon" tooltip

- [ ] **Step 2: Wire the login page (login/page.tsx)**

Apply the same changes from Step 1 to `web/src/app/login/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/page.tsx web/src/app/login/page.tsx
git commit -m "feat(auth): wire login forms to NextAuth signIn"
```

---

### Task 12: Wire Register Page

**Files:**
- Modify: `web/src/app/register/page.tsx`

- [ ] **Step 1: Wire registration form**

In `web/src/app/register/page.tsx`:

1. Add imports:
```typescript
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
```

2. Add state:
```typescript
const router = useRouter();
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState("");
```

3. The existing page uses individual state variables: `fullName`, `studentId`, `yearOfEntry`, `phoneNumber`, `email`, `password`, `passwordConfirmation`. Replace the submit button handler with:
```typescript
const handleRegister = async () => {
  setIsLoading(true);
  setError("");

  if (password !== passwordConfirmation) {
    setError("Passwords do not match");
    setIsLoading(false);
    return;
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName,
        email,
        password,
        nim: studentId,
        yearOfEntry: parseInt(yearOfEntry),
        phone: phoneNumber,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    // Auto-login after successful registration
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/login");
    } else {
      router.push("/news");
    }
  } catch {
    setError("Something went wrong");
  } finally {
    setIsLoading(false);
  }
};
```

4. Connect submit button to `handleRegister`
5. Display error state in the form

- [ ] **Step 2: Commit**

```bash
git add web/src/app/register/page.tsx
git commit -m "feat(auth): wire registration form to API endpoint"
```

---

### Task 13: Wire Forgot Password Page

**Files:**
- Modify: `web/src/app/forgot-password/page.tsx`

- [ ] **Step 1: Wire forgot password form**

In `web/src/app/forgot-password/page.tsx`:

1. Add state:
```typescript
const [isLoading, setIsLoading] = useState(false);
const [success, setSuccess] = useState(false);
const [error, setError] = useState("");
```

2. Replace the `onSubmit` handler body (currently `// Handle send email`) with:
```typescript
e.preventDefault();
setIsLoading(true);
setError("");

try {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (res.ok) {
    setSuccess(true);
  } else {
    const data = await res.json();
    setError(data.error || "Something went wrong");
  }
} catch {
  setError("Something went wrong");
} finally {
  setIsLoading(false);
}
```

3. Show success message when `success` is true: "If an account with that email exists, a reset link has been sent."
4. Show error if present
5. Disable button during loading

- [ ] **Step 2: Commit**

```bash
git add web/src/app/forgot-password/page.tsx
git commit -m "feat(auth): wire forgot-password form to API endpoint"
```

---

### Task 14: Wire Reset Password Page

**Files:**
- Modify: `web/src/app/reset-password/page.tsx`

- [ ] **Step 1: Wire reset password form**

In `web/src/app/reset-password/page.tsx`:

1. Add imports:
```typescript
import { useSearchParams, useRouter } from "next/navigation";
```

2. Read token from URL:
```typescript
const searchParams = useSearchParams();
const router = useRouter();
const token = searchParams.get("token");
```

3. Add state:
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState("");
```

4. Replace the `onSubmit` handler body (currently `// Handle reset password`) with:
```typescript
e.preventDefault();
setIsLoading(true);
setError("");

if (!token) {
  setError("Invalid reset link");
  setIsLoading(false);
  return;
}

if (password !== confirmPassword) {
  setError("Passwords do not match");
  setIsLoading(false);
  return;
}

try {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });

  const data = await res.json();

  if (res.ok) {
    router.push("/login");
  } else {
    setError(data.error || "Something went wrong");
  }
} catch {
  setError("Something went wrong");
} finally {
  setIsLoading(false);
}
```

5. Show error if `!token`: "Invalid reset link. Please request a new one."
6. Show error state in form
7. Disable button during loading

- [ ] **Step 2: Commit**

```bash
git add web/src/app/reset-password/page.tsx
git commit -m "feat(auth): wire reset-password form with token from URL"
```

---

### Task 15: Wire Change Password Page

**Files:**
- Modify: `web/src/app/profile/change-password/page.tsx`

- [ ] **Step 1: Wire change password form**

In `web/src/app/profile/change-password/page.tsx`:

1. Add state:
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState(false);
```

2. Replace the Button `onClick` (currently `router.back()`) with:
```typescript
const handleChangePassword = async () => {
  setIsLoading(true);
  setError("");
  setSuccess(false);

  if (newPassword !== confirmPassword) {
    setError("Passwords do not match");
    setIsLoading(false);
    return;
  }

  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(data.error || "Something went wrong");
    }
  } catch {
    setError("Something went wrong");
  } finally {
    setIsLoading(false);
  }
};
```

3. Connect Button to `handleChangePassword`
4. Show success/error messages
5. Disable button during loading

- [ ] **Step 2: Commit**

```bash
git add web/src/app/profile/change-password/page.tsx
git commit -m "feat(auth): wire change-password form to API endpoint"
```

---

### Task 16: Wire Logout

**Files:**
- Modify: `web/src/app/news/page.tsx`
- Modify: `web/src/app/career/page.tsx`
- Modify: `web/src/app/connection/page.tsx`
- Modify: `web/src/app/donation/page.tsx`
- Modify: `web/src/app/profile/page.tsx`

The `LogoutModal` component (`web/src/components/news/logout-modal.tsx`) accepts `onConfirm` as a prop. Each of the 5 pages above passes an inline handler that does `router.push("/login")`. All 5 must be updated.

- [ ] **Step 1: Update all 5 pages**

In each of the 5 files listed above:

1. Add import:
```typescript
import { signOut } from "next-auth/react";
```

2. Replace the `onConfirm` handler on `<LogoutModal>` from:
```typescript
onConfirm={() => {
  setLogoutOpen(false);
  router.push("/login");
}}
```
to:
```typescript
onConfirm={async () => {
  setLogoutOpen(false);
  await signOut({ callbackUrl: "/login" });
}}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/news/page.tsx web/src/app/career/page.tsx web/src/app/connection/page.tsx web/src/app/donation/page.tsx web/src/app/profile/page.tsx
git commit -m "feat(auth): wire logout to NextAuth signOut in all pages"
```

---

### Task 17: Verify Full Auth Flow

- [ ] **Step 1: Start the dev server**

Run: `cd web && pnpm dev`

- [ ] **Step 2: Test registration**

Navigate to `/register`, fill in all fields, submit. Expected: user created, auto-redirected to `/news`.

- [ ] **Step 3: Test login**

Navigate to `/login`, enter registered email/password, submit. Expected: redirected to `/news`.

- [ ] **Step 4: Test route protection**

While logged out, navigate to `/news`. Expected: redirected to `/login`.

- [ ] **Step 5: Test forgot password**

Navigate to `/forgot-password`, enter registered email, submit. Expected: success message shown, reset link logged in terminal.

- [ ] **Step 6: Test reset password**

Copy the reset link from terminal, navigate to it. Enter new password, submit. Expected: redirected to `/login`. Log in with new password.

- [ ] **Step 7: Test change password**

While logged in, navigate to `/profile/change-password`. Enter current and new password, submit. Expected: success message. Log out and log in with new password.

- [ ] **Step 8: Test logout**

Click logout. Expected: redirected to `/login`. Navigating to `/news` should redirect to `/login`.

- [ ] **Step 9: Fix any issues found during testing**

- [ ] **Step 10: Final commit (if any fixes were made)**

Stage only the specific files that were fixed. Do NOT use `git add -A` (risk of staging `.env.local`).

```bash
git add <fixed-files>
git commit -m "fix(auth): resolve issues found during testing"
```
