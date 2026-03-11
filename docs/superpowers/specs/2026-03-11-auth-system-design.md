# Auth System Design — IAOS Connect

## Overview

Implement email/password authentication for IAOS Connect using NextAuth.js v5, Drizzle ORM, and the existing AWS RDS PostgreSQL database. All auth logic lives within Next.js API routes (App Router). JWT-based sessions with HTTP-only cookies.

## Stack

- **Auth:** NextAuth.js v5 (Credentials provider, JWT strategy)
- **ORM:** Drizzle ORM
- **Database:** Existing AWS RDS PostgreSQL (`iaos_mobile`)
- **Password hashing:** bcrypt

## Database Schema

### Users Table

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| name | VARCHAR(255) | Required |
| email | VARCHAR(255) | Unique, required |
| password_hash | VARCHAR(255) | bcrypt hashed |
| nim | VARCHAR(20) | Student ID, unique |
| year_of_entry | INTEGER | Enrollment year |
| phone | VARCHAR(20) | Phone number |
| role | ENUM('user', 'admin') | Default: 'user' |
| email_verified | BOOLEAN | Default: false (for future use) |
| profile_image_url | TEXT | Nullable (for future use) |
| reset_token | VARCHAR(255) | Nullable, for password reset |
| reset_token_expires | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-updated |

Schema file: `web/src/db/schema/users.ts`

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
| `web/src/middleware.ts` | Route protection middleware |

## API Endpoints

### POST `/api/auth/register`

1. Validate input (all required fields, email format, password min length)
2. Check if email or NIM already exists → 409 Conflict
3. Hash password with bcrypt (salt rounds: 10)
4. Insert user into DB with role `'user'`
5. Return success

### POST `/api/auth/[...nextauth]` (Login via Credentials provider)

1. NextAuth receives email + password
2. Look up user by email → 401 if not found
3. Compare password hash → 401 if mismatch
4. Return user object → NextAuth issues JWT cookie

### POST `/api/auth/forgot-password`

1. Receive email
2. Look up user → always return success (don't leak email existence)
3. Generate random reset token, set expiry (1 hour)
4. Save token + expiry to user record
5. Log reset link to console (email delivery deferred)

### POST `/api/auth/reset-password`

1. Receive token + new password
2. Find user by token where expiry > now → 400 if invalid/expired
3. Hash new password, update user record
4. Clear reset token fields
5. Return success

## Session & JWT

- **Strategy:** JWT (stateless)
- **JWT payload:** `id`, `email`, `name`, `role`
- **Session object:** Extended to include `id` and `role` accessible via `useSession()` and `getServerSession()`
- **Cookie:** HTTP-only, secure, SameSite (managed by NextAuth)

## Middleware (Route Protection)

- **Public routes:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/_next`, `/images`, static assets
- **All other routes:** Require valid NextAuth JWT token; redirect to `/login` if absent

## Frontend Wiring

- Login → `signIn("credentials", { email, password })` from `next-auth/react`
- Register → `POST /api/auth/register`, then auto-login via `signIn()`
- Forgot password → `POST /api/auth/forgot-password`
- Reset password → `POST /api/auth/reset-password`
- Logout → `signOut()` from `next-auth/react`

## Security

### Implemented

- Passwords hashed with bcrypt (never stored plain text)
- JWT in HTTP-only, secure, SameSite cookie
- Reset tokens are random, single-use, expire after 1 hour
- Forgot password doesn't reveal email existence
- Middleware blocks unauthenticated access before page renders
- Role stored in JWT for authorization checks

### Deferred

- Rate limiting on auth endpoints
- Email verification flow
- Social login (Google/Apple)
- Account lockout after failed attempts

## Decisions

- **Approach A (monolith):** All backend logic in Next.js API routes — single deployment, leverages existing Docker/Nginx/EB infra
- **JWT over DB sessions:** Simpler, no session table needed, sufficient for current scale
- **Email delivery deferred:** Reset tokens logged to console for development; email service wired later
- **PWA compatible:** API routes serve JSON, consumed identically by PWA and any future native client
