# Google OAuth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth sign-in with account linking, profile completion gate for new Google users, and remove Apple OAuth placeholders.

**Architecture:** NextAuth v5 Drizzle Adapter + Google provider. New `accounts` table for provider tracking. Middleware-enforced profile completion gate redirects incomplete profiles to `/complete-profile`. JWT session strategy retained.

**Tech Stack:** Next.js 16, NextAuth v5 (beta.30), Drizzle ORM, PostgreSQL, `@auth/drizzle-adapter`, Tailwind CSS v4, Vitest

**Spec:** `docs/superpowers/specs/2026-03-13-google-oauth-design.md`

---

## Chunk 1: Database Schema & Migration

### Task 1: Install `@auth/drizzle-adapter`

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install the dependency**

Run:
```bash
cd web && pnpm add @auth/drizzle-adapter
```

- [ ] **Step 2: Verify installation**

Run:
```bash
cd web && pnpm list @auth/drizzle-adapter
```
Expected: Shows `@auth/drizzle-adapter` with a version number.

- [ ] **Step 3: Commit**

```bash
git add web/package.json web/pnpm-lock.yaml
git commit -m "chore: install @auth/drizzle-adapter"
```

---

### Task 2: Create `accounts` table schema

**Files:**
- Create: `web/src/db/schema/accounts.ts`
- Modify: `web/src/db/schema/index.ts`

- [ ] **Step 1: Create the accounts schema file**

Create `web/src/db/schema/accounts.ts`:

```typescript
import { pgTable, uuid, varchar, text, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 255 }),
    scope: text("scope"),
    idToken: text("id_token"),
  },
  (table) => [
    uniqueIndex("provider_provider_account_id_idx").on(
      table.provider,
      table.providerAccountId
    ),
  ]
);
```

- [ ] **Step 2: Export from schema index**

Modify `web/src/db/schema/index.ts` — add this line:

```typescript
export * from "./accounts";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```
Expected: No errors related to accounts schema.

- [ ] **Step 4: Commit**

```bash
git add web/src/db/schema/accounts.ts web/src/db/schema/index.ts
git commit -m "feat: add accounts table schema for OAuth provider tracking"
```

---

### Task 3: Modify `users` table schema

**Files:**
- Modify: `web/src/db/schema/users.ts`

- [ ] **Step 1: Update the users schema**

Modify `web/src/db/schema/users.ts` to make these changes:
1. Make `passwordHash` nullable (remove `.notNull()`)
2. Make `nim` nullable (remove `.notNull()`, keep `.unique()`)
3. Make `yearOfEntry` nullable (remove `.notNull()`)
4. Make `phone` nullable (remove `.notNull()`)
5. Change `emailVerified` from `boolean("email_verified").default(false).notNull()` to `timestamp("email_verified")`
6. Add `profileComplete: boolean("profile_complete").default(false).notNull()`

The resulting file should be:

```typescript
import { pgTable, pgEnum, uuid, varchar, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  nim: varchar("nim", { length: 20 }).unique(),
  yearOfEntry: integer("year_of_entry"),
  phone: varchar("phone", { length: 20 }),
  role: roleEnum("role").default("user").notNull(),
  emailVerified: timestamp("email_verified"),
  profileImageUrl: text("profile_image_url"),
  profileComplete: boolean("profile_complete").default(false).notNull(),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -30
```
Expected: May show errors in `register/route.ts` or `change-password/route.ts` due to type changes — that's expected and will be fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add web/src/db/schema/users.ts
git commit -m "feat: make user fields nullable for Google OAuth, add profileComplete"
```

---

### Task 4: Generate and run database migration

**Files:**
- Create: `web/drizzle/` (new migration files, auto-generated)

- [ ] **Step 1: Generate the migration**

Run:
```bash
cd web && npx drizzle-kit generate
```
Expected: Creates a new migration SQL file in `web/drizzle/`.

- [ ] **Step 2: Review the generated migration**

Read the generated SQL file. It should contain:
- `CREATE TABLE accounts` with all columns
- `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`
- `ALTER TABLE users ALTER COLUMN nim DROP NOT NULL`
- `ALTER TABLE users ALTER COLUMN year_of_entry DROP NOT NULL`
- `ALTER TABLE users ALTER COLUMN phone DROP NOT NULL`
- `ALTER TABLE users` change `email_verified` from boolean to timestamp
- `ALTER TABLE users ADD COLUMN profile_complete`

- [ ] **Step 3: Manually add data migration to the SQL file**

Append to the end of the generated SQL file (before any snapshot changes):

```sql
-- Set profileComplete = true for all existing users (they have complete profiles)
UPDATE "users" SET "profile_complete" = true WHERE "profile_complete" = false;
```

Note on `emailVerified`: The existing codebase has a TODO comment indicating email verification was never implemented, so no users have `email_verified = true`. The column type change from boolean to timestamp will likely involve dropping and recreating the column, which is safe since all values are `false`/default. Review the generated SQL to confirm this — if Drizzle generates an `ALTER COLUMN ... TYPE timestamp USING ...` instead of a drop/recreate, verify the conversion is correct.

- [ ] **Step 4: Run the migration**

Run:
```bash
cd web && npx drizzle-kit migrate
```
Expected: Migration applies successfully.

- [ ] **Step 5: Commit**

```bash
git add web/drizzle/
git commit -m "feat: add migration for accounts table and nullable user fields"
```

---

## Chunk 2: Auth Configuration

### Task 5: Add Google provider and Drizzle adapter to NextAuth config

**Files:**
- Modify: `web/src/lib/auth.ts`

- [ ] **Step 1: Update auth.ts**

Replace the entire contents of `web/src/lib/auth.ts` with:

```typescript
import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
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

        // Google-only users have no password
        if (!user.passwordHash) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profileComplete: user.profileComplete,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.profileComplete = user.profileComplete;
      }

      // Refresh profileComplete from DB when session is updated
      if (trigger === "update" && token.id) {
        const [dbUser] = await db
          .select({ profileComplete: users.profileComplete, role: users.role })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        if (dbUser) {
          token.profileComplete = dbUser.profileComplete;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.profileComplete = token.profileComplete as boolean;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface User {
    role?: string;
    profileComplete?: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      profileComplete: boolean;
    } & DefaultSession["user"];
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/auth.ts
git commit -m "feat: add Google OAuth provider and Drizzle adapter to NextAuth"
```

---

### Task 6: Update environment variables

**Files:**
- Modify: `web/.env.local.example`

- [ ] **Step 1: Add Google OAuth env vars to example file**

Add these lines to the end of `web/.env.local.example`:

```
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

- [ ] **Step 2: Add actual values to `.env.local`**

Add to `web/.env.local` (the user must provide their own values from Google Cloud Console):

```
AUTH_GOOGLE_ID=<paste your Google OAuth Client ID>
AUTH_GOOGLE_SECRET=<paste your Google OAuth Client Secret>
```

- [ ] **Step 3: Commit**

```bash
git add web/.env.local.example
git commit -m "chore: add Google OAuth env vars to .env.local.example"
```

---

### Task 7: Update register route to set `profileComplete: true`

**Files:**
- Modify: `web/src/app/api/auth/register/route.ts`

- [ ] **Step 1: Add profileComplete to insert values**

In `web/src/app/api/auth/register/route.ts`, update the `db.insert(users).values({...})` call (around line 81) to include `profileComplete: true`:

```typescript
    await db.insert(users).values({
      name,
      email,
      passwordHash,
      nim,
      yearOfEntry,
      phone,
      profileComplete: true,
    });
```

Credential-registered users provide all required fields during registration, so their profile is already complete.

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/auth/register/route.ts
git commit -m "fix: set profileComplete true for credential-registered users"
```

---

### Task 8: Add null-check to change-password route

**Files:**
- Modify: `web/src/app/api/auth/change-password/route.ts`

- [ ] **Step 1: Add passwordHash null-check**

In `web/src/app/api/auth/change-password/route.ts`, after the user lookup (line 43: `if (!user)` block), add a null-check for `passwordHash`:

```typescript
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Password change is not available for accounts using social login" },
        { status: 400 }
      );
    }
```

This goes between the `if (!user)` block (line 43-47) and the `bcrypt.compare` call (line 50).

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/auth/change-password/route.ts
git commit -m "fix: add null-check for passwordHash in change-password route"
```

---

## Chunk 3: Middleware & Complete Profile

### Task 9: Update middleware with profile completion gate

**Files:**
- Modify: `web/src/middleware.ts`

- [ ] **Step 1: Update the middleware**

Replace the contents of `web/src/middleware.ts` with:

```typescript
export const runtime = "nodejs";

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

  // Profile completion gate — redirect incomplete profiles
  if (req.auth.user?.profileComplete === false && pathname !== "/complete-profile") {
    const completeProfileUrl = new URL("/complete-profile", req.nextUrl.origin);
    return NextResponse.redirect(completeProfileUrl);
  }

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    if (req.auth.user?.role !== "admin") {
      const newsUrl = new URL("/news", req.nextUrl.origin);
      return NextResponse.redirect(newsUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add web/src/middleware.ts
git commit -m "feat: add profile completion gate to middleware"
```

---

### Task 10: Update middleware tests

**Files:**
- Modify: `web/src/middleware.test.ts`

- [ ] **Step 1: Add tests for profile completion gate**

Add these test cases to `web/src/middleware.test.ts`, inside the `describe("middleware")` block:

```typescript
  describe("profile completion gate", () => {
    it("redirects authenticated user with incomplete profile to /complete-profile", () => {
      const res = middlewareCallback(
        createRequest("/news", { user: { id: "1", profileComplete: false } })
      );
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toBe(
        "http://localhost:3000/complete-profile"
      );
    });

    it("allows authenticated user with incomplete profile to access /complete-profile", () => {
      const res = middlewareCallback(
        createRequest("/complete-profile", {
          user: { id: "1", profileComplete: false },
        })
      );
      expect(res?.headers.get("location")).toBeNull();
    });

    it("allows authenticated user with complete profile to access /news", () => {
      const res = middlewareCallback(
        createRequest("/news", {
          user: { id: "1", profileComplete: true },
        })
      );
      expect(res?.headers.get("location")).toBeNull();
    });
  });
```

- [ ] **Step 2: Update existing authenticated user tests to include profileComplete**

Update the existing `describe("authenticated users")` test cases to include `profileComplete: true` in the auth object:

Change `{ user: { id: "1" } }` to `{ user: { id: "1", profileComplete: true } }` in both existing tests.

- [ ] **Step 3: Run tests**

Run:
```bash
cd web && npx vitest run src/middleware.test.ts
```
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add web/src/middleware.test.ts
git commit -m "test: add middleware tests for profile completion gate"
```

---

### Task 11: Create complete-profile API route

**Files:**
- Create: `web/src/app/api/auth/complete-profile/route.ts`

- [ ] **Step 1: Create the API route**

Create `web/src/app/api/auth/complete-profile/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { nim, yearOfEntry, phone } = await request.json();

    // Validate required fields
    if (!nim || !yearOfEntry || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
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

    // Check NIM uniqueness
    const [existingNim] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.nim, nim))
      .limit(1);

    if (existingNim && existingNim.id !== session.user.id) {
      return NextResponse.json(
        { error: "Student ID already registered" },
        { status: 409 }
      );
    }

    // Update user profile
    await db
      .update(users)
      .set({
        nim,
        yearOfEntry,
        phone,
        profileComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/auth/complete-profile/route.ts
git commit -m "feat: add complete-profile API route"
```

---

### Task 12: Create complete-profile page

**Files:**
- Create: `web/src/app/complete-profile/page.tsx`

- [ ] **Step 1: Create the page**

Create `web/src/app/complete-profile/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthLayout } from "@/components/ui/auth-layout";
import { AuthHeader } from "@/components/ui/auth-header";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return year.toString();
});

export default function CompleteProfilePage() {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [yearOfEntry, setYearOfEntry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const isFormValid =
    studentId.trim() !== "" &&
    yearOfEntry !== "" &&
    phoneNumber.trim() !== "";

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nim: studentId,
          yearOfEntry: parseInt(yearOfEntry),
          phone: phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to complete profile");
        return;
      }

      // Refresh the session so JWT picks up profileComplete: true
      await update();

      router.push("/news");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title="Complete Your Profile" />

      <div className="px-4">
        <p className="font-[family-name:var(--font-work-sans)] text-[14px] leading-[20px] text-neutral-600">
          Please fill in your details to continue using IAOS Connect
        </p>
      </div>

      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
        <TextInput
          label="Student ID (NIM)"
          placeholder="Enter your Student ID (NIM)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />

        <TextInput
          label="Year of Entry"
          type="select"
          value={yearOfEntry}
          onChange={
            ((e: React.ChangeEvent<HTMLSelectElement>) =>
              setYearOfEntry(e.target.value)) as unknown as React.ChangeEventHandler<HTMLInputElement>
          }
        >
          <option value="" disabled>
            Select your year of entry
          </option>
          {YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </TextInput>

        <TextInput
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        {error && (
          <p className="font-[family-name:var(--font-work-sans)] text-sm text-red-500">
            {error}
          </p>
        )}

        <Button
          variant={isFormValid && !isLoading ? "primary" : "disabled"}
          disabled={!isFormValid || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </AuthLayout>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/complete-profile/page.tsx
git commit -m "feat: add complete-profile page for Google OAuth users"
```

---

## Chunk 4: UI Changes

### Task 13: Update login page — enable Google, remove Apple

**Files:**
- Modify: `web/src/app/login/page.tsx`

- [ ] **Step 1: Remove AppleIcon component**

Delete the `AppleIcon` function (lines 34-41 of current file).

- [ ] **Step 2: Enable the Google button**

Replace:
```tsx
          {/* TODO: Add Google OAuth provider to NextAuth config */}
          <Button variant="secondary" icon={<GoogleIcon />} disabled>
            Continue with Google
          </Button>
```

With:
```tsx
          <Button
            variant="secondary"
            icon={<GoogleIcon />}
            onClick={() => signIn("google")}
          >
            Continue with Google
          </Button>
```

- [ ] **Step 3: Remove Apple button**

Delete:
```tsx
          {/* TODO: Add Apple OAuth provider to NextAuth config */}
          <Button variant="secondary" icon={<AppleIcon />} disabled>
            Continue with Apple
          </Button>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/login/page.tsx
git commit -m "feat: enable Google sign-in button, remove Apple from login page"
```

---

### Task 14: Update home/splash page — enable Google, remove Apple

**Files:**
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: Remove AppleIcon component**

Delete the `AppleIcon` function (lines 36-42 of current file).

- [ ] **Step 2: Enable the Google button**

Replace:
```tsx
            {/* TODO: Add Google OAuth provider to NextAuth config */}
            <Button variant="secondary" icon={<GoogleIcon />} disabled>
              Continue with Google
            </Button>
```

With:
```tsx
            <Button
              variant="secondary"
              icon={<GoogleIcon />}
              onClick={() => signIn("google")}
            >
              Continue with Google
            </Button>
```

- [ ] **Step 3: Remove Apple button**

Delete:
```tsx
            {/* TODO: Add Apple OAuth provider to NextAuth config */}
            <Button variant="secondary" icon={<AppleIcon />} disabled>
              Continue with Apple
            </Button>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/page.tsx
git commit -m "feat: enable Google sign-in button, remove Apple from home page"
```

---

## Chunk 5: Verification

### Task 15: Full build and test verification

- [ ] **Step 1: Run all tests**

Run:
```bash
cd web && npx vitest run
```
Expected: All tests pass.

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
cd web && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Run build**

Run:
```bash
cd web && pnpm build
```
Expected: Build succeeds.

- [ ] **Step 4: Manual testing checklist**

After setting up Google Cloud OAuth credentials in `.env.local`:

1. Start dev server: `cd web && pnpm dev`
2. Visit `http://localhost:3000` — Google button should be active, no Apple button
3. Visit `http://localhost:3000/login` — same: Google active, no Apple
4. Click "Continue with Google" — should redirect to Google consent screen
5. After Google auth with a new email — should redirect to `/complete-profile`
6. Fill in NIM, year of entry, phone — should redirect to `/news`
7. Sign out, sign back in with Google — should go straight to `/news` (profile already complete)
8. Sign out, sign in with existing email+password — should work as before
9. Try changing password for a Google-only user — should show appropriate error
10. Register a new user via email/password — should go straight to `/news` (not `/complete-profile`)
