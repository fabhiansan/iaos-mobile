# Google OAuth Integration — Design Spec

**Date:** 2026-03-13
**Status:** Approved
**Approach:** NextAuth Drizzle Adapter + Google Provider

## Overview

Add Google OAuth sign-in to IAOS Connect, allowing users to authenticate via Google alongside the existing email/password flow. Google sign-in supports both existing account linking (by email) and new user registration. New Google users must complete their profile (NIM, year of entry, phone) before accessing the app.

Apple OAuth placeholders are removed entirely.

## 1. Database Schema Changes

### New `accounts` table

Standard NextAuth adapter table for tracking OAuth provider links.

| Column             | Type         | Constraints                  |
|--------------------|--------------|------------------------------|
| `id`               | UUID         | PK, default random           |
| `userId`           | UUID         | FK → users.id, NOT NULL      |
| `type`             | varchar(255) | NOT NULL ("oauth", etc.)     |
| `provider`         | varchar(255) | NOT NULL ("google", etc.)    |
| `providerAccountId`| varchar(255) | NOT NULL (Google's user ID)  |
| `access_token`     | text         | nullable                     |
| `refresh_token`    | text         | nullable                     |
| `expires_at`       | integer      | nullable                     |
| `token_type`       | varchar(255) | nullable                     |
| `scope`            | text         | nullable                     |
| `id_token`         | text         | nullable                     |

Unique constraint on `(provider, providerAccountId)`.

### Modify `users` table

Make these columns **nullable** to support Google-only sign-ups who haven't completed their profile:

- `passwordHash` → nullable (Google users have no password)
- `nim` → nullable (keep unique constraint)
- `yearOfEntry` → nullable
- `phone` → nullable

**Add column:**

- `profileComplete` — boolean, default `false`

**Migration:** Set `profileComplete = true` for all existing users (they registered via the form and already have all fields).

## 2. Auth Configuration

### File: `web/src/lib/auth.ts`

**New dependencies:**
- `@auth/drizzle-adapter` — Drizzle adapter for NextAuth
- Google provider from `next-auth/providers/google`

**Changes:**
- Add Drizzle adapter to NextAuth config
- Add Google provider with `allowDangerousEmailAccountLinking: true`
- Keep existing Credentials provider unchanged

**Callback changes:**

- `signIn` callback: For new Google users (auto-created by adapter), the user record will have `profileComplete: false` by default.
- `jwt` callback: Embed `profileComplete` into the JWT token (query from DB on first sign-in).
- `session` callback: Expose `profileComplete` on the session object.

### Environment variables

Add to `.env.local`:

```
AUTH_GOOGLE_ID=<Google OAuth Client ID>
AUTH_GOOGLE_SECRET=<Google OAuth Client Secret>
```

Update `.env.local.example` with these placeholders.

## 3. Middleware — Profile Completion Gate

### File: `web/src/middleware.ts`

**Add `/complete-profile` to accessible routes** (authenticated users who haven't completed their profile need access to this page).

**New middleware logic** (after existing auth check):

```
if user is authenticated
  AND profileComplete === false
  AND not on /complete-profile
→ redirect to /complete-profile
```

This blocks all app routes until the profile is complete. Existing credential-registered users are unaffected (`profileComplete: true` from migration).

## 4. Complete Profile Page & API

### New page: `web/src/app/complete-profile/page.tsx`

- Form with fields: NIM, Year of Entry, Phone
- Same validation rules as the registration form
- No navigation to other routes (mandatory, blocking)
- On success, redirects to `/news`

### New API route: `POST /api/auth/complete-profile`

- Requires authenticated session
- Validates NIM (alphanumeric), yearOfEntry (1950–current year), phone (digits only)
- Checks NIM uniqueness
- Updates user record: sets `nim`, `yearOfEntry`, `phone`, `profileComplete: true`
- Returns success/error JSON

## 5. UI Changes

### Login page (`web/src/app/login/page.tsx`)

- Enable "Continue with Google" button: remove `disabled`, wire `onClick` to `signIn("google")`
- Remove Apple button and `AppleIcon` component
- Remove Apple TODO comment

### Home/splash page (`web/src/app/page.tsx`)

- Enable "Continue with Google" button: remove `disabled`, wire `onClick` to `signIn("google")`
- Remove Apple button and `AppleIcon` component
- Remove Apple TODO comment

## 6. Account Linking Behavior

| Scenario | Behavior |
|----------|----------|
| Existing user (email+password) signs in with Google | Account linked automatically via `allowDangerousEmailAccountLinking`. User logs in, `profileComplete` is already `true`. |
| New user signs in with Google (no existing account) | New user created by adapter with `profileComplete: false`. Redirected to `/complete-profile`. |
| Google-linked user signs in with password | Works as before — Credentials provider matches by email. |

## 7. Google Cloud Console Setup

1. Go to Google Cloud Console → create or select a project
2. Navigate to APIs & Services → OAuth consent screen
3. Configure consent screen: External, app name "IAOS Connect", add your email as support/dev contact
4. Navigate to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. **Authorized JavaScript origins:**
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
7. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
8. Copy Client ID → `AUTH_GOOGLE_ID`, Client Secret → `AUTH_GOOGLE_SECRET`

## 8. New Dependencies

| Package | Purpose |
|---------|---------|
| `@auth/drizzle-adapter` | NextAuth ↔ Drizzle ORM adapter |

No other new dependencies needed — `next-auth/providers/google` is already included in `next-auth`.

## 9. Files Changed

| File | Action |
|------|--------|
| `web/src/db/schema/users.ts` | Make columns nullable, add `profileComplete` |
| `web/src/db/schema/accounts.ts` | **New** — accounts table definition |
| `web/src/db/schema/index.ts` | Export accounts schema |
| `web/src/lib/auth.ts` | Add adapter, Google provider, update callbacks |
| `web/src/middleware.ts` | Add profile completion gate |
| `web/src/app/complete-profile/page.tsx` | **New** — complete profile form |
| `web/src/app/api/auth/complete-profile/route.ts` | **New** — complete profile API |
| `web/src/app/login/page.tsx` | Enable Google, remove Apple |
| `web/src/app/page.tsx` | Enable Google, remove Apple |
| `web/.env.local.example` | Add Google OAuth env vars |
| `web/drizzle/` | New migration files |
