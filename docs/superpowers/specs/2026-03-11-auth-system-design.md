# Auth System Design — IAOS Connect

## Overview

Implement email/password authentication for IAOS Connect using NextAuth.js v5, Drizzle ORM, and the existing AWS RDS PostgreSQL database. All auth logic lives within Next.js API routes (App Router). JWT-based sessions with HTTP-only cookies.

## Stack

- **Auth:** NextAuth.js v5 (Credentials provider, JWT strategy)
- **ORM:** Drizzle ORM
- **Database:** Existing AWS RDS PostgreSQL (`iaos_mobile`)
- **Password hashing:** bcrypt

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXTAUTH_SECRET` | Secret key for signing JWTs (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (e.g., `http://localhost:3000` in dev) |
| `DATABASE_URL` | PostgreSQL connection string (existing `DB_CONNECTION_STRING` from `.env.local`) |

## Password Policy

All endpoints that accept passwords (register, reset-password, change-password) enforce:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

This matches the frontend validation already in place.

## Database Schema

### Users Table

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| name | VARCHAR(255) | Required |
| email | VARCHAR(255) | Unique, required |
| password_hash | VARCHAR(255) | bcrypt hashed |
| nim | VARCHAR(20) | Student ID, unique |
| year_of_entry | INTEGER | Enrollment year (1950–current year) |
| phone | VARCHAR(20) | Phone number, digits only |
| role | ENUM('user', 'admin') | Default: 'user' |
| email_verified | BOOLEAN | Default: false (for future use) |
| profile_image_url | TEXT | Nullable (for future use) |
| reset_token | VARCHAR(255) | Nullable, for password reset |
| reset_token_expires | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-updated |

Schema file: `web/src/db/schema/users.ts`

### Migrations

Use `drizzle-kit push` for development (direct schema push to DB). The `users` table is new — no existing table to alter.

## File Structure

| File | Purpose |
|---|---|
| `web/src/db/index.ts` | Drizzle client instance |
| `web/src/db/schema/users.ts` | User table schema |
| `web/src/lib/auth.ts` | NextAuth config (providers, callbacks, JWT/session customization) |
| `web/src/app/api/auth/[...nextauth]/route.ts` | NextAuth API route handler |
| `web/src/app/api/auth/register/route.ts` | Registration endpoint (POST) |
| `web/src/app/api/auth/forgot-password/route.ts` | Generate reset token (POST) |
| `web/src/app/api/auth/reset-password/route.ts` | Validate token + set new password (POST) |
| `web/src/app/api/auth/change-password/route.ts` | Change password (authenticated, POST) |
| `web/src/middleware.ts` | Route protection middleware |

## API Endpoints

### Response Format

All endpoints return JSON:

- **Success:** `{ success: true }` or `{ success: true, data: { ... } }` with status 200
- **Validation error:** `{ error: "Description" }` with status 400
- **Unauthorized:** `{ error: "Invalid credentials" }` with status 401
- **Conflict:** `{ error: "Email already registered" }` with status 409
- **Server error:** `{ error: "Internal server error" }` with status 500

### POST `/api/auth/register`

1. Validate input:
   - `name`: required, non-empty
   - `email`: required, valid email format
   - `password`: must meet password policy
   - `nim`: required, alphanumeric
   - `year_of_entry`: required, integer between 1950 and current year
   - `phone`: required, digits only
2. Check if email or NIM already exists → 409 Conflict
3. Hash password with bcrypt (salt rounds: 10)
4. Insert user into DB with role `'user'`
5. Return `{ success: true }`

### POST `/api/auth/[...nextauth]` (Login via Credentials provider)

1. NextAuth receives email + password
2. Look up user by email → return `null` if not found (NextAuth returns 401)
3. Compare password hash → return `null` if mismatch
4. Return user object → NextAuth issues JWT cookie

### POST `/api/auth/forgot-password`

1. Receive `{ email }`
2. Look up user → always return `{ success: true }` (don't leak email existence)
3. If user found: generate reset token via `crypto.randomBytes(32).toString('hex')`, set expiry (1 hour from now)
4. Save hashed token + expiry to user record
5. Log reset link to console: `/reset-password?token=<token>` (email delivery deferred)

### POST `/api/auth/reset-password`

1. Receive `{ token, password }`
2. Hash the received token, find user by hashed token where expiry > now → 400 if invalid/expired
3. Validate new password against password policy
4. Hash new password, update user record
5. Clear reset token fields
6. Return `{ success: true }`

### POST `/api/auth/change-password`

1. Requires valid session (check via `getServerSession()`) → 401 if not authenticated
2. Receive `{ currentPassword, newPassword }`
3. Look up user by session `id`
4. Verify `currentPassword` against stored hash → 400 if mismatch
5. Validate `newPassword` against password policy
6. Hash new password, update user record
7. Return `{ success: true }`

## Session & JWT

- **Strategy:** JWT (stateless)
- **JWT payload:** `id`, `email`, `name`, `role`
- **JWT maxAge:** 30 days (NextAuth default) — acceptable for a PWA where users expect to stay logged in
- **Session object:** Extended to include `id` and `role` accessible via `useSession()` and `getServerSession()`
- **Cookie:** HTTP-only, secure, SameSite (managed by NextAuth)
- **Note:** Role changes won't take effect until the user re-authenticates. Acceptable since role changes are rare admin operations.

## Middleware (Route Protection)

- **Public routes:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/_next`, `/images`, static assets
- **All other routes:** Require valid NextAuth JWT token; redirect to `/login` if absent

## Frontend Wiring

- Login → `signIn("credentials", { email, password })` from `next-auth/react`
- Register → `POST /api/auth/register`, then auto-login via `signIn()`
- Forgot password → `POST /api/auth/forgot-password`
- Reset password → reads `token` from URL `searchParams`, sends `POST /api/auth/reset-password` with `{ token, password }`
- Change password → `POST /api/auth/change-password` with `{ currentPassword, newPassword }`
- Logout → `signOut()` from `next-auth/react`
- Google/Apple buttons → hide or disable with "Coming soon" label until social providers are implemented

## Security

### Implemented

- Passwords hashed with bcrypt (never stored plain text)
- JWT in HTTP-only, secure, SameSite cookie
- Reset tokens generated with `crypto.randomBytes(32)`, hashed before storage, single-use, expire after 1 hour
- Forgot password doesn't reveal email existence
- Middleware blocks unauthenticated access before page renders
- Role stored in JWT for authorization checks
- Password policy enforced on both frontend and backend

### Deferred

- Rate limiting on auth endpoints
- Email verification flow
- Social login (Google/Apple)
- Account lockout after failed attempts
- CSRF protection for custom API routes beyond NextAuth's built-in handling

## Decisions

- **Approach A (monolith):** All backend logic in Next.js API routes — single deployment, leverages existing Docker/Nginx/EB infra
- **JWT over DB sessions:** Simpler, no session table needed, sufficient for current scale. Trade-off: role changes require re-auth.
- **Email delivery deferred:** Reset tokens logged to console for development; email service wired later
- **PWA compatible:** API routes serve JSON, consumed identically by PWA and any future native client
- **drizzle-kit push for migrations:** Simple development workflow, no migration files to manage initially
