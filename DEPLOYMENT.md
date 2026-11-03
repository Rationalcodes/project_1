# KUMBHAKARAN PLATFORM — PRODUCTION DEPLOYMENT PLAYBOOK

This document contains the complete, step-by-step instructions to deploy Kumbhakaran to production:
* **Frontends (Customer, Partner, Admin)**: Deployed to **Vercel** with temporary `*.vercel.app` URLs (or custom domain).
* **Backend API (NestJS + Fastify + PostGIS)**: Deployed to **Render.com** (or Railway / Fly.io / Docker).
* **Database**: Hosted on **Supabase PostgreSQL (EU-West-1)** with PostGIS enabled.

---

## 1. PRE-DEPLOYMENT CHECKLIST

| Component | Status | Details |
| :--- | :---: | :--- |
| **All Frontend Builds** | ✅ VERIFIED | All 3 apps build with 0 TypeScript errors in < 1.3 seconds. |
| **Backend Build** | ✅ VERIFIED | `nest build` generates optimized Fastify bundles in `dist/`. |
| **Prisma 6.4 Client** | ✅ VERIFIED | Auto-generated during backend build. |
| **PostGIS Discovery** | ✅ VERIFIED | 10/10 automated tests passing (`test-phase2.ts`). |
| **Auth & Security** | ✅ VERIFIED | 6/6 automated security tests passing (`test-auth-security.ts`). |
| **SPA Route Rewrites** | ✅ VERIFIED | `vercel.json` configured in all 3 frontend apps to eliminate 404s on page refresh. |
| **Dynamic CORS** | ✅ VERIFIED | Allows `localhost`, `*.vercel.app`, and `kumbhakaran.in`. |

---

## 2. DATABASE PREPARATION (SUPABASE)

Open your **[Supabase Dashboard](https://supabase.com/dashboard)** -> Navigate to **SQL Editor** -> Execute:

### Run Migration 003 (`backend/migrations/003_secure_auth_and_roles.sql`)
```sql
-- 1. Ensure users table has all necessary columns
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  google_id VARCHAR(128) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
  last_logout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_id VARCHAR(128);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);

-- Safely normalize legacy roles to 'CUSTOMER'
UPDATE public.users 
SET role = 'CUSTOMER', updated_at = NOW() 
WHERE role NOT IN ('CUSTOMER', 'ADMIN');

-- Apply role check constraint safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_global_role'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT chk_users_global_role CHECK (role IN ('CUSTOMER', 'ADMIN'));
  END IF;
END $$;

-- 2. Multi-Salon membership table (Matches live schema: is_active BOOLEAN)
CREATE TABLE IF NOT EXISTS public.salon_members (
  id VARCHAR(64) PRIMARY KEY,
  salon_id VARCHAR(64) NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL DEFAULT 'PARTNER_STAFF',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on (salon_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_salon_member'
  ) THEN
    ALTER TABLE public.salon_members 
    ADD CONSTRAINT uq_salon_member UNIQUE (salon_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_salon_members_salon ON public.salon_members(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_members_user ON public.salon_members(user_id);

-- 3. Stored Procedure for Out-of-Band Admin Promotion
CREATE OR REPLACE PROCEDURE public.promote_user_to_admin(target_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(TRIM(target_email))) THEN
    RAISE EXCEPTION 'User with email % does not exist. Sign in with Google first.', target_email;
  END IF;

  UPDATE public.users
  SET role = 'ADMIN', updated_at = NOW()
  WHERE LOWER(email) = LOWER(TRIM(target_email));

  RAISE NOTICE 'User % has been successfully promoted to ADMIN.', target_email;
END;
$$;

REVOKE EXECUTE ON PROCEDURE public.promote_user_to_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE public.promote_user_to_admin(TEXT) TO postgres;
```

---

## 3. BACKEND DEPLOYMENT (RENDER.COM)

Deploy the backend first so you have its live URL (e.g. `https://kumbhakaran-backend.onrender.com`).

### Option A: 1-Click Blueprints (Using `render.yaml`)
1. Push this repository to **GitHub**.
2. In [Render Dashboard](https://dashboard.render.com/), click **New** -> **Blueprint**.
3. Connect your repository. Render automatically reads [`render.yaml`](file:///e:/KSalon/render.yaml).
4. Set the `DATABASE_URL` environment variable to your Supabase connection string:
   ```
   postgresql://postgres.mgblemlqjnmkhhcfibpb:[YOUR_NEW_SUPABASE_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
   ```
5. Click **Apply**.

### Option B: Manual Web Service on Render
* **Type**: Web Service
* **Runtime**: Node
* **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter @kumbhakaran/backend build`
* **Start Command**: `node backend/dist/main.js`
* **Health Check Path**: `/api/v1/health`
* **Environment Variables**:
  * `NODE_ENV`: `production`
  * `PORT`: `10000`
  * `DATABASE_URL`: `postgresql://postgres.mgblemlqjnmkhhcfibpb:[YOUR_NEW_SUPABASE_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`
  * `GOOGLE_CLIENT_ID`: `871471875670-5erjemuob83qh5a4nmlm20s305fk0gof.apps.googleusercontent.com`
  * `JWT_SECRET`: `kumbhakaran-production-jwt-secret-key-32chars`
  * `JWT_EXPIRES_IN`: `24h`

Once deployed, copy your backend URL: e.g. `https://kumbhakaran-backend.onrender.com`

---

## 4. FRONTEND DEPLOYMENT (VERCEL)

Deploy the three frontend applications on Vercel as separate projects linked to the same repository:

### Project 1: Customer Web App (`apps/customer-web`)
1. In [Vercel Dashboard](https://vercel.com/new), import your GitHub repository.
2. Set **Root Directory**: `apps/customer-web`
3. Framework Preset: **Vite**
4. Configure **Environment Variables**:
   * `VITE_API_BASE_URL`: `https://kumbhakaran-backend.onrender.com/api/v1`
   * `VITE_GOOGLE_CLIENT_ID`: `871471875670-5erjemuob83qh5a4nmlm20s305fk0gof.apps.googleusercontent.com`
   * `VITE_GOOGLE_MAPS_API_KEY`: (Your Google Maps Browser Key)
5. Click **Deploy**.
6. Note the deployed URL: e.g. `https://kumbhakaran-customer.vercel.app`

---

### Project 2: Partner Web App (`apps/partner-web`)
1. In Vercel Dashboard, click **Add New** -> **Project** -> Import same repository.
2. Set **Root Directory**: `apps/partner-web`
3. Framework Preset: **Vite**
4. Configure **Environment Variables**:
   * `VITE_API_BASE_URL`: `https://kumbhakaran-backend.onrender.com/api/v1`
   * `VITE_GOOGLE_CLIENT_ID`: `871471875670-5erjemuob83qh5a4nmlm20s305fk0gof.apps.googleusercontent.com`
   * `VITE_CUSTOMER_APP_URL`: `https://kumbhakaran-customer.vercel.app` (URL from Project 1)
   * `VITE_GOOGLE_MAPS_API_KEY`: (Your Google Maps Browser Key)
5. Click **Deploy**.
6. Note the deployed URL: e.g. `https://kumbhakaran-partner.vercel.app`

---

### Project 3: Admin Web App (`apps/admin-web`)
1. In Vercel Dashboard, click **Add New** -> **Project** -> Import same repository.
2. Set **Root Directory**: `apps/admin-web`
3. Framework Preset: **Vite**
4. Configure **Environment Variables**:
   * `VITE_API_BASE_URL`: `https://kumbhakaran-backend.onrender.com/api/v1`
   * `VITE_GOOGLE_CLIENT_ID`: `871471875670-5erjemuob83qh5a4nmlm20s305fk0gof.apps.googleusercontent.com`
   * `VITE_CUSTOMER_APP_URL`: `https://kumbhakaran-customer.vercel.app`
   * `VITE_PARTNER_APP_URL`: `https://kumbhakaran-partner.vercel.app`
5. Click **Deploy**.
6. Note the deployed URL: e.g. `https://kumbhakaran-admin.vercel.app`

---

## 5. POST-DEPLOYMENT: GOOGLE OAUTH URL AUTHORIZATION

After obtaining your Vercel URLs, add them to your Google Cloud Console to allow Google Sign-in on the deployed URLs:

1. Open **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Select your Client ID: `871471875670-5erjemuob83qh5a4nmlm20s305fk0gof.apps.googleusercontent.com`.
3. Under **Authorized JavaScript origins**, add your new production URLs:
   * `https://kumbhakaran-customer.vercel.app`
   * `https://kumbhakaran-partner.vercel.app`
   * `https://kumbhakaran-admin.vercel.app`
   * `https://kumbhakaran-backend.onrender.com`
4. Under **Authorized redirect URIs**, add the same URLs.
5. Click **Save**.

---

## 6. PROVISIONING YOUR ADMIN ACCOUNT

1. Visit your deployed Admin Web App: `https://kumbhakaran-admin.vercel.app`.
2. Click **"Sign in with Google"** with your administrator Google account (`prabhat@...`).
3. The platform will initially display:
   > **Access Denied: Administrative Authorization Required (Role: CUSTOMER)**
4. Open **Supabase Dashboard** -> **SQL Editor** -> Execute:
   ```sql
   CALL promote_user_to_admin('your-admin-email@gmail.com');
   ```
5. Click **"Sign Out & Try Another Account"** on the admin app and sign in again.
6. The HQ Console will unlock with full administrative privileges!
