# SLOON — PRODUCTION INCIDENT RESPONSE RUNBOOK

**Target Audience:** Platform Operations, Backend Engineers, and On-Call Responders  
**Platform:** Sloon Salon Discovery & Real-Time Queue Operations  
**Last Updated:** Phase 6 Production Hardening  

---

## INCIDENT SEVERITY MATRIX

| Severity | Definition | Target Resolution | Escalation Path |
| :--- | :--- | :--- | :--- |
| **P1 — Critical** | Backend completely unreachable, customer booking down, queue positions lost. | $< 15$ minutes | Immediate Lead / Architect alert |
| **P2 — High** | WebSockets failing across salons, database pool timeout spikes (`P2024`). | $< 30$ minutes | Backend Engineer on-call |
| **P3 — Medium** | Single salon queue anomaly, slow discovery queries, partial frontend caching bug. | $< 2$ hours | Core Engineer |
| **P4 — Low** | Cosmetic admin glitch, non-critical log warning. | Next release | Ticket backlog |

---

## 1. PROCEDURE: BACKEND DOWNTIME / UNRESPONSIVE API

### Diagnostic Steps
1. **Check Live Probe:**
   ```bash
   curl -I https://project-1-tt3c.onrender.com/api/v1/health/live
   ```
   - If HTTP 200: Node.js process is active. Proceed to Database Probe.
   - If HTTP 502/503/Timeout: Render instance is down, asleep, or memory exhausted.
2. **Inspect Render Deployment Logs:**
   - Go to [Render Dashboard](https://dashboard.render.com/) $\rightarrow$ Select `kumbhakaran-backend` $\rightarrow$ Click **Logs**.
   - Check for fatal exceptions: `FATAL`, `PrismaClientInitializationError`, `JavaScript heap out of memory`, `EADDRINUSE`.

### Remediation Steps
1. **Restart Service:**
   - In Render Dashboard, click **Manual Deploy** $\rightarrow$ **Restart Service**.
   - Watch logs for bootstrap log:
     ```
     🚀 Kumbhakaran NestJS Fastify Backend running on: http://localhost:10000
     ```
2. **If Service Fails on Start:**
   - Check if `DATABASE_URL` is set correctly in Environment tab.
   - If a bad commit was deployed, click **Deploys** $\rightarrow$ Revert to previous successful deploy.

---

## 2. PROCEDURE: DATABASE CONNECTION POOL EXHAUSTION / TIMEOUTS (`P2024`)

### Diagnostic Steps
1. **Check Readiness Probe:**
   ```bash
   curl -i https://project-1-tt3c.onrender.com/api/v1/health/ready
   ```
2. **Search Backend Logs for Pool Timeout:**
   - Search Render logs for `PrismaError_P2024` or `db.transaction.failed`.
3. **Inspect Supabase Connection Pool:**
   - Open [Supabase Dashboard](https://supabase.com/dashboard) $\rightarrow$ Select project `mgblemlqjnmkhhcfibpb`.
   - Go to **Database** $\rightarrow$ **Connection Pooling**.
   - Check Active Connections. If connections $\ge 15$, the pool is saturated.

### Remediation Steps
1. **Verify `PRISMA_CONNECTION_LIMIT`:**
   - Ensure Render environment variable `PRISMA_CONNECTION_LIMIT` is set to `8` (or at most `12`).
   - If multiple instances were spun up, connections = `instances * PRISMA_CONNECTION_LIMIT`. Reduce `PRISMA_CONNECTION_LIMIT` to `4` per instance.
2. **Terminate Hanging Backend Connections via Supabase SQL Editor:**
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle in transaction' 
     AND state_change < current_timestamp - INTERVAL '5 minutes';
   ```

---

## 3. PROCEDURE: QUEUE SYNCHRONIZATION OR POSITION DISCREPANCY

### Diagnostic Steps
1. **Check Recalculation Telemetry:**
   - Search logs for `queue.recalculation.*` or `queue.entry.recalculation.failed`.
2. **Inspect Salon Queue Table in Supabase:**
   ```sql
   SELECT id, customer_name, status, position, joined_at, estimated_wait_minutes
   FROM public.salon_queue_entries
   WHERE salon_id = '<TARGET_SALON_ID>'
     AND status IN ('waiting', 'called', 'in_service')
   ORDER BY joined_at ASC;
   ```

### Remediation Steps
1. **Force Manual Recalculation:**
   - Partner clicking **"Refresh Queue"** or calling an entry automatically triggers queue recalculation via `QueueEngineService.recalculate()`.
2. **Stale Ticket Expiry:**
   - If tickets from previous days are cluttering the queue, execute the platform daily sweep:
   ```sql
   UPDATE public.salon_queue_entries
   SET status = 'cancelled', 
       cancelled_at = NOW(), 
       cancellation_reason = 'Manual reset: Stale ticket cleanup'
   WHERE status IN ('waiting', 'called', 'in_service')
     AND joined_at < (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata');
   ```

---

## 4. PROCEDURE: WEBSOCKET DISCONNECTION / REALTIME DEGRADATION

### Diagnostic Steps
1. **Verify WebSocket Transport:**
   - In browser developer tools $\rightarrow$ Network tab $\rightarrow$ Filter by `WS` $\rightarrow$ Look for connection to `wss://.../queue/?EIO=4&transport=websocket`.
2. **Verify Frontend Fallback Polling:**
   - Frontends are architected to automatically fall back to adaptive REST polling (5s–10s rate) if WebSockets disconnect.
   - Verify network tab shows periodic requests to `/api/v1/salons/:id/queue/overview`.

### Remediation Steps
1. If client is on a restrictive corporate firewall blocking WebSockets, Socket.io automatically falls back to HTTP long-polling (`transport=polling`).
2. If Render restarted, clients automatically reconnect within 1–5 seconds and re-subscribe to their active salon rooms without page refresh.

---

## 5. PROCEDURE: FAILED PRODUCTION DEPLOYMENT & ROLLBACK

### Frontend Rollback (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com/) $\rightarrow$ Open the affected project.
2. Go to **Deployments**.
3. Identify the previous working deployment (with green checkmark).
4. Click the three dots `...` on the right $\rightarrow$ Select **Instant Rollback**.
5. The working version goes live instantly ($< 5$ seconds).

### Backend Rollback (Render)
1. Go to [Render Dashboard](https://dashboard.render.com/) $\rightarrow$ Open `kumbhakaran-backend`.
2. Go to **Deploys**.
3. Select the previous successful deploy $\rightarrow$ Click **Revert to this deploy**.

### Git Rollback
```bash
git checkout main
git pull origin main
git revert HEAD --no-edit
git push origin main
```

---

## 6. PROCEDURE: SUSPECTED SECURITY INCIDENT OR CREDENTIAL LEAK

### Threat Mitigation Steps
1. **JWT Compromise:**
   - If `JWT_SECRET` is suspected leaked:
     1. Generate a new 64-character secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
     2. Update `JWT_SECRET` in Render Environment Variables.
     3. Restart backend service.
     4. *Result:* All existing active user sessions will be immediately invalidated and required to re-authenticate.
2. **Database Password Rotation:**
   - Go to Supabase Dashboard $\rightarrow$ **Settings** $\rightarrow$ **Database** $\rightarrow$ **Database Password** $\rightarrow$ Change Password.
   - Immediately update `DATABASE_URL` in Render $\rightarrow$ Deploy.
3. **Google OAuth Client Security:**
   - Go to Google Cloud Console $\rightarrow$ APIs & Services $\rightarrow$ Credentials.
   - Verify Authorized JavaScript origins contains ONLY `https://sloon.in`, `https://partner.sloon.in`, and `https://admin.sloon.in`.
   - Remove any unknown or suspicious domains.
