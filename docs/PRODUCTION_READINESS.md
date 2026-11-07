# SLOON — PRODUCTION READINESS & DEPLOYMENT GUIDE

**Version:** 1.0.0 (Production Release Candidate)  
**Repository:** `Rationalcodes/project_1`  
**Platform Stack:** NestJS 11 + Fastify + Prisma 6 + PostgreSQL 17 (PostGIS) + Vite + React 18  

---

## 1. ARCHITECTURE OVERVIEW & DOMAIN MAPPING

Sloon is architected as a high-performance, real-time salon discovery, queue management, and booking platform.

```
+---------------------------------------------------------------------------------------------------------+
|                                              PUBLIC INTERNET                                            |
+-------------------+-----------------------------------+-----------------------------------+-------------+
                    |                                   |                                   |
           (HTTPS Port 443)                    (HTTPS Port 443)                    (HTTPS Port 443)
                    v                                   v                                   v
         +---------------------+             +---------------------+             +---------------------+
         |      sloon.in       |             |  partner.sloon.in   |             |   admin.sloon.in    |
         |  Customer Web App   |             |  Partner Portal App |             |  Admin HQ Console   |
         |  [Vercel Frontend]  |             |  [Vercel Frontend]  |             |  [Vercel Frontend]  |
         +----------+----------+             +----------+----------+             +----------+----------+
                    |                                   |                                   |
                    +-------------------+---------------+-----------------------------------+
                                        |
                   REST APIs & Realtime WebSockets (WSS)
                                        |
                                        v
                    +---------------------------------------+
                    |             api.sloon.in              |
                    |   (Render: project-1-tt3c.onrender)   |
                    |   NestJS + Fastify REST & Socket.io   |
                    +-------------------+-------------------+
                                        |
                        Prisma 6 Client Pooled Session
                           (AWS Ireland eu-west-1)
                                        |
                                        v
                    +---------------------------------------+
                    |          Supabase PostgreSQL          |
                    |     PostGIS Geography + PgBouncer     |
                    +---------------------------------------+
```

### Production Domain Routing Table

| Application | Production Custom Domain | Hosting Provider | Deployment Root / Service | Current Fallback / Staging URL |
| :--- | :--- | :--- | :--- | :--- |
| **Customer App** | `https://sloon.in` | Vercel | `apps/customer-web` | `https://customer-web-inky.vercel.app/` |
| **Partner Portal** | `https://partner.sloon.in` | Vercel | `apps/partner-web` | `https://project-1-xq1k.vercel.app/` |
| **Admin HQ** | `https://admin.sloon.in` | Vercel | `apps/admin-web` | Deployed alongside partner/customer |
| **Backend REST & WS** | `https://api.sloon.in` | Render (Frankfurt) | `backend/` | `https://project-1-tt3c.onrender.com` |
| **Database** | Supabase AWS eu-west-1 | Supabase (Managed) | PostgreSQL 17 + PostGIS | `aws-0-eu-west-1.pooler.supabase.com` |

---

## 2. ENVIRONMENT VARIABLE AUDIT & CHECKLIST

All environment variables across the backend and three frontend applications have been audited. Frontend variables strictly adhere to Vite conventions (`VITE_*`) and contain **zero secret credentials**.

### Complete Environment Variable Table

| Variable Name | Application(s) | Required / Optional | Configured in Code? | Description & Manual Action Required |
| :--- | :--- | :---: | :---: | :--- |
| `DATABASE_URL` | Backend | **Required** | ✅ Yes | Supabase connection string with PgBouncer (`port 6543`) or session pooler (`port 5432`). Set in Render Dashboard. |
| `PRISMA_CONNECTION_LIMIT` | Backend | **Required** | ✅ Yes | Set to `8` in Render. Capped at $\le 12$ to preserve headroom on Supabase's 15-connection pool budget. |
| `JWT_SECRET` | Backend | **Required** | ✅ Yes | Cryptographic secret key ($\ge 32$ chars) used for JWT session tokens and SmartQueue signatures. Set in Render. |
| `JWT_EXPIRES_IN` | Backend | Optional | ✅ Yes | Session validity duration. Defaults to `24h`. |
| `GOOGLE_CLIENT_ID` | Backend | **Required** | ✅ Yes | Google Cloud Console OAuth 2.0 Web Client ID. Used to verify customer & partner Google ID tokens. |
| `ALLOWED_ORIGINS` | Backend | Optional | ✅ Yes | Comma-separated CORS origins. `sloon.in`, `partner.sloon.in`, `admin.sloon.in`, and `*.vercel.app` are handled automatically by regex. |
| `NODE_ENV` | Backend | **Required** | ✅ Yes | Set to `production` in Render. Enables error sanitization and Fastify optimizations. |
| `PORT` | Backend | Optional | ✅ Yes | Defaults to `10000` on Render or `3001` locally. |
| `VITE_API_BASE_URL` | Customer, Partner, Admin | Optional | ✅ Yes | API URL. Falls back cleanly to `https://project-1-tt3c.onrender.com/api/v1` on non-local hostnames. Configure to `https://api.sloon.in/api/v1` after DNS setup. |
| `VITE_GOOGLE_CLIENT_ID` | Customer, Partner, Admin | **Required** | ✅ Yes | Public Google Client ID for `@react-oauth/google`. Same value as backend `GOOGLE_CLIENT_ID`. |
| `VITE_GOOGLE_MAPS_API_KEY` | Customer, Partner | **Required** | ✅ Yes | Google Maps Browser API key for map rendering, directions deep links, and distance calculation. |
| `VITE_MAPBOX_ACCESS_TOKEN` | Partner | Optional | ✅ Yes | Mapbox public token for location pin picker. |
| `VITE_CUSTOMER_APP_URL` | Admin, Partner | Optional | ✅ Yes | Link back to Customer app. Defaults to `https://sloon.in`. |
| `VITE_PARTNER_APP_URL` | Admin | Optional | ✅ Yes | Link back to Partner portal. Defaults to `https://partner.sloon.in`. |

---

## 3. BACKEND PRODUCTION SECURITY & HARDENING

1. **OWASP Security Headers (Phase 6 Hardening):**
   - Automatically injected on all HTTP responses via Fastify `onSend` hook:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: SAMEORIGIN`
     - `X-XSS-Protection: 1; mode=block`
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
     - `Referrer-Policy: strict-origin-when-cross-origin`
2. **Request Correlation Tracking:**
   - Every incoming HTTP request is assigned a unique `X-Request-Id` header.
   - Structured JSON logs and exception payloads attach `requestId` for fast production debugging.
3. **Multi-Tenant Salon Isolation:**
   - Strict `SalonOwnerGuard` verifies that the authenticated user owns the targeted `salonId` or is registered as an active `PARTNER_OWNER` in `salon_members`.
   - Prevents cross-salon access to appointments, queue tickets, revenue, staff, and customer records.
4. **Role-Based Access Control:**
   - All admin endpoints (`/admin/salons/*`) require valid JWT bearer tokens verified by `JwtAuthGuard` and `RolesGuard` enforcing `role === 'ADMIN'`.
5. **Database Error Sanitization (Phase 5):**
   - `GlobalExceptionFilter` intercepts all uncaught database errors.
   - Database tables, connection strings, host IPs, and raw SQL queries are scrubbed before reaching API clients.
   - Maps Prisma `P2002` $\rightarrow$ `409 Conflict`, `P2025` $\rightarrow$ `404 Not Found`, and `P2024` $\rightarrow$ `503 Service Unavailable`.
6. **Payload Size Limits:**
   - Fastify `bodyLimit` configured to `52,428,800` (50MB) for salon media uploads while preventing unauthenticated memory exhaustion.

---

## 4. QUEUE & BOOKING RELIABILITY GUARANTEES

- **Advisory Transaction Locks:** Salon-level queue mutations execute inside serialized transactions with pessimistic database locks or isolation guards, preventing simultaneous double-allocation.
- **Idempotency Keys:** Customer queue admissions accept an `idempotencyKey` parameter. Network retries return the original ticket rather than generating a duplicate ticket.
- **Pause & Resume Invariants:** Pausing admissions sets `isQueueOpen = false`. In-service tickets continue processing; customer cancellations and staff reassignments function normally. New admissions are safely rejected with HTTP 409.
- **Single-Instance In-Flight Mutex:** Background sweeps (`sweepAllSalonsClosingAndDailyReset()`) use an atomic `isSweepInFlight` mutex to drop overlapping interval runs.

---

## 5. DATABASE & SUPABASE CONNECTION BUDGET

- **Database Host:** Supabase PostgreSQL 17 in `eu-west-1` (PostGIS 3.3.7).
- **Spatial GiST Index:** `idx_salons_location_gist` on `salons(location)` verified for high-speed spatial distance searches.
- **Session Pool Sizing:**
  - Supabase pool budget: 15 connections.
  - Reserved headroom: 3 connections (Supabase studio, migrations, admin tasks).
  - Maximum application pool budget: 12 connections.
  - Configured Render `PRISMA_CONNECTION_LIMIT`: **8 connections**.
  - Headroom remaining: 4 connections.
- **Prisma Transaction Options:**
  - `maxWait: 5000ms` (time to acquire connection from pool).
  - `timeout: 10000ms` (transaction timeout for transatlantic query roundtrips).

### Database Backup & Recovery Procedure

1. **Automated Point-in-Time Recovery (PITR):**
   - If on Supabase Pro plan: Supabase automatically retains continuous WAL archives allowing point-in-time recovery to any second within the retention window.
2. **Manual Pre-Deployment Logical Backup (pg_dump):**
   ```bash
   pg_dump -h aws-0-eu-west-1.pooler.supabase.com -p 5432 -U postgres.mgblemlqjnmkhhcfibpb -d postgres --format=custom --file=sloon_backup_$(date +%Y%m%d_%H%M%S).dump
   ```
3. **Emergency Restore Procedure:**
   ```bash
   # Restore into an isolated staging database first
   pg_restore -h <STAGING_HOST> -p 5432 -U <STAGING_USER> -d <STAGING_DB> --clean --no-owner sloon_backup_YYYYMMDD_HHMMSS.dump
   ```

---

## 6. MONITORING & OPERATIONAL VISIBILITY

### Health Check Endpoints

| Endpoint | HTTP Method | Target Purpose | Database Query? |
| :--- | :---: | :--- | :---: |
| `/api/v1/health/live` | `GET` | Process liveness probe for Render and container orchestrators | No (Instant 0ms) |
| `/api/v1/health/ready` | `GET` | Service readiness probe (`SELECT 1;`) | Yes (Lightweight ping) |
| `/api/v1/health` | `GET` | Full diagnostic probe (PostGIS, tables, GiST index) | Yes (Comprehensive) |

### Recommended Free-Tier Monitoring Setup

1. **Uptime Monitoring (UptimeRobot / BetterStack - Free Tiers):**
   - Create HTTP monitor hitting: `https://project-1-tt3c.onrender.com/api/v1/health/live` every 5 minutes.
   - Create HTTP monitor hitting: `https://project-1-tt3c.onrender.com/api/v1/health/ready` every 10 minutes.
   - Prevents Render free-tier spin-down while alerting on downtime.
2. **Log Monitoring:**
   - Render Dashboard provides real-time streaming logs.
   - Look for structured events: `db.transaction.failed`, `http.request.exception`, `queue.entry.recalculation.failed`.

---

## 7. ROLLBACK PROCEDURE

1. **Frontend Instant Rollback (Vercel):**
   - Open Vercel Dashboard $\rightarrow$ Select project (`customer-web`, `partner-web`, or `admin-web`).
   - Navigate to **Deployments** tab.
   - Locate the previous successful deployment $\rightarrow$ Click **"..."** $\rightarrow$ Click **"Instant Rollback"**.
   - Rollback completes globally in $< 5$ seconds without building.
2. **Backend Rollback (Render):**
   - Open Render Dashboard $\rightarrow$ Select `kumbhakaran-backend`.
   - Go to **Deploys** tab.
   - Locate previous active deployment $\rightarrow$ Click **"Revert to this deploy"**.
3. **Git Revert via CLI:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

---

## 8. PRE-LAUNCH & POST-LAUNCH CHECKLISTS

### Pre-Launch Checklist
- [x] All 5 optimization phases completed and committed to `main`.
- [x] NestJS backend builds cleanly (`pnpm run build:backend`).
- [x] Full monorepo and Vite frontend apps build cleanly (`pnpm run build`).
- [x] Realtime queue room isolation tests passing (23/23).
- [x] Queue concurrency, idempotency, and locking tests passing (11/11).
- [x] Frontend deduplication and caching tests passing (10/10).
- [x] Backend architecture, exception mapping, and mutex tests passing.
- [x] PostgreSQL 17 and PostGIS spatial GiST indexes verified.
- [x] GitHub Actions CI workflow configured (`.github/workflows/ci.yml`).
- [ ] Google Cloud Console: Add `https://sloon.in`, `https://partner.sloon.in`, `https://admin.sloon.in` to Authorized JavaScript Origins.
- [ ] Render Dashboard: Verify `PRISMA_CONNECTION_LIMIT=8`, `DATABASE_URL`, and `JWT_SECRET`.
- [ ] Vercel Dashboard: Add custom domains `sloon.in`, `partner.sloon.in`, and `admin.sloon.in`.

### Post-Launch Verification Checklist
- [ ] Visit `https://sloon.in` $\rightarrow$ Confirm salon discovery and geolocation search work.
- [ ] Sign in with Google on Customer Web $\rightarrow$ Verify profile and active ticket screens.
- [ ] Join a live queue $\rightarrow$ Confirm realtime queue counter updates via WebSockets.
- [ ] Visit `https://partner.sloon.in` $\rightarrow$ Log in as salon partner $\rightarrow$ Verify queue management controls.
- [ ] Call, start, and complete a service $\rightarrow$ Verify ticket status transitions.
- [ ] Visit `https://admin.sloon.in` $\rightarrow$ Confirm admin dashboard loads operational telemetry.
