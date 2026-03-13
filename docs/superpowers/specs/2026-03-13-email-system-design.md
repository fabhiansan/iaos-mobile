# Email System Design: Nodemailer + Haraka

## Overview

Add transactional email capability to IAOS Connect using Nodemailer as the SMTP client and Haraka as a self-hosted SMTP server running in Docker alongside the existing services.

## Problem

Password reset tokens are logged to console (`web/src/app/api/auth/forgot-password/route.ts:44-45`), making the feature non-functional in production. The `emailVerified` field in the users schema is never set to `true`. No email packages or SMTP configuration exist in the project.

## Architecture

```
Next.js App (nodemailer) --SMTP--> Haraka container (port 25) --SMTP--> recipient MTA --> inbox
```

All components run within the existing Docker Compose stack on Elastic Beanstalk.

## Components

### 1. Haraka SMTP Server (Docker container)

- **Image:** Custom Dockerfile based on `node:20-alpine`, installs Haraka globally
- **Service name:** `mail` in `docker-compose.yml`
- **Port:** 25 (internal only, not exposed to host)
- **Plugins enabled:**
  - `dkim_sign` — signs outgoing emails with DKIM for deliverability
  - `max_unrecognized_commands` — basic security
  - `tls` (optional, for outbound TLS to receiving servers)
- **Configuration files** stored in `server/haraka/` directory:
  - `config/host_list` — `iaos-connect.com`
  - `config/me` — hostname for HELO
  - `config/plugins` — enabled plugin list
  - `config/dkim/iaos-connect.com/` — DKIM private key and selector

### 2. Email Utility Module

**File:** `web/src/lib/email.ts`

- Creates a Nodemailer transporter pointing to `SMTP_HOST:SMTP_PORT`
- Exports `sendEmail({ to, subject, html })` function
- Exports `sendPasswordResetEmail(email, resetUrl)` with an HTML template
- No authentication required (internal Docker network, trusted relay)

### 3. Updated Forgot Password Route

**File:** `web/src/app/api/auth/forgot-password/route.ts`

- Replace `console.log` of reset URL with call to `sendPasswordResetEmail()`
- Keep the console.log in development (when `SMTP_HOST` is not set)
- Sender address: `noreply@iaos-connect.com`

### 4. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `mail` | Haraka container hostname |
| `SMTP_PORT` | `25` | SMTP port |
| `SMTP_FROM` | `noreply@iaos-connect.com` | Default sender address |

Added to: `.env.local.example`, `docker-compose.yml` environment section.

### 5. DNS Records Required

After deployment, the domain owner must add:

- **SPF:** `v=spf1 ip4:<EB-elastic-IP> -all` on `iaos-connect.com` TXT record
- **DKIM:** TXT record at `default._domainkey.iaos-connect.com` with the generated public key
- **DMARC** (recommended): `v=DMARC1; p=quarantine; rua=mailto:admin@iaos-connect.com`

## File Changes Summary

| Action | File |
|--------|------|
| Create | `server/haraka/Dockerfile` |
| Create | `server/haraka/config/me` |
| Create | `server/haraka/config/host_list` |
| Create | `server/haraka/config/plugins` |
| Create | `server/haraka/config/smtp.ini` |
| Create | `server/haraka/setup-dkim.sh` (generates DKIM keypair) |
| Create | `web/src/lib/email.ts` |
| Modify | `web/src/app/api/auth/forgot-password/route.ts` |
| Modify | `docker-compose.yml` (add mail service) |
| Modify | `web/.env.local.example` (add SMTP vars) |
| Install | `nodemailer` + `@types/nodemailer` in `web/` |

## Out of Scope

- Email verification flow (infrastructure will support it; wiring deferred)
- Inbound email / MX record setup
- Rate limiting on email sends
- Email templates beyond password reset
- OAuth / social login
