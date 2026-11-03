-- ==============================================================================
-- KUMBHAKARAN PLATFORM - INCREMENTAL MIGRATION 003 (CORRECTED)
-- Production Authentication, Role Separation & Live Schema Alignment
-- ==============================================================================

-- 1. Ensure `users` table has all necessary columns
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

-- Add last_logout_at column if not present (for server-side session revocation)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_id VARCHAR(128);

-- Add indexes on lookup keys
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);

-- Safely normalize any legacy roles on existing users to 'CUSTOMER'
-- (Their salon ownership is governed by salons.owner_id and salon_members)
UPDATE public.users 
SET role = 'CUSTOMER', updated_at = NOW() 
WHERE role NOT IN ('CUSTOMER', 'ADMIN');

-- Apply role check constraint safely (after data normalization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_global_role'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT chk_users_global_role CHECK (role IN ('CUSTOMER', 'ADMIN'));
  END IF;
END $$;

-- 2. Ensure `salon_members` matches the live table schema
CREATE TABLE IF NOT EXISTS public.salon_members (
  id VARCHAR(64) PRIMARY KEY,
  salon_id VARCHAR(64) NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL DEFAULT 'PARTNER_STAFF',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint on (salon_id, user_id) to prevent duplicate memberships
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

-- 3. Safely link existing salon record to salon_members (Preserving existing data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.salons WHERE id = 'salon-1793713039749' AND owner_id = 'owner-arjun-101') THEN
    -- Ensure owner exists in users with CUSTOMER role
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES ('owner-arjun-101', 'owner-arjun-101@kumbhakaran.in', 'Arjun K.', 'CUSTOMER', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'CUSTOMER';

    -- Insert membership using exact live column names (is_active BOOLEAN)
    INSERT INTO public.salon_members (id, salon_id, user_id, role, is_active, created_at)
    VALUES ('mem-arjun-101', 'salon-1793713039749', 'owner-arjun-101', 'PARTNER_OWNER', TRUE, NOW())
    ON CONFLICT (salon_id, user_id) DO UPDATE SET role = 'PARTNER_OWNER', is_active = TRUE;
  END IF;
END $$;

-- 4. Out-of-Band Admin Promotion Stored Procedure (Security Definer, owned by postgres)
CREATE OR REPLACE PROCEDURE public.promote_user_to_admin(target_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(TRIM(target_email))) THEN
    RAISE EXCEPTION 'User with email % does not exist. Sign in with Google first.', target_email;
  END IF;

  -- Perform the promotion
  UPDATE public.users
  SET role = 'ADMIN',
      updated_at = NOW()
  WHERE LOWER(email) = LOWER(TRIM(target_email));

  RAISE NOTICE 'User % has been successfully promoted to global ADMIN.', target_email;
END;
$$;

-- 5. Revoke procedure execution from public (Only postgres superuser can run this)
REVOKE EXECUTE ON PROCEDURE public.promote_user_to_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE public.promote_user_to_admin(TEXT) TO postgres;
