-- ==============================================================================
-- KUMBHAKARAN PLATFORM - INCREMENTAL MIGRATION 003
-- Production Authentication, Role Separation & Least-Privilege Role Setup
-- ==============================================================================

-- 1. Ensure `users` table has all necessary columns and constraints
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  google_id VARCHAR(128) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
  last_logout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure last_logout_at exists if users was already created previously
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_id VARCHAR(128);

-- Add index on email for quick auth lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);

-- 2. Create `salon_members` table for salon-specific roles (Multi-Salon Architecture)
CREATE TABLE IF NOT EXISTS public.salon_members (
  id VARCHAR(64) PRIMARY KEY,
  salon_id VARCHAR(64) NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL CHECK (role IN ('PARTNER_OWNER', 'PARTNER_STAFF')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'INVITED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_salon_member UNIQUE (salon_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_members_salon ON public.salon_members(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_members_user ON public.salon_members(user_id);

-- 3. Link existing salon record (if present) to salon_members
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.salons WHERE id = 'salon-1793713039749' AND owner_id = 'owner-arjun-101') THEN
    -- Ensure owner exists in users
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES ('owner-arjun-101', 'owner-arjun-101@kumbhakaran.in', 'Arjun K.', 'CUSTOMER', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'CUSTOMER';

    -- Insert membership
    INSERT INTO public.salon_members (id, salon_id, user_id, role, status, created_at, updated_at)
    VALUES ('mem-arjun-101', 'salon-1793713039749', 'owner-arjun-101', 'PARTNER_OWNER', 'ACTIVE', NOW(), NOW())
    ON CONFLICT (salon_id, user_id) DO NOTHING;
  END IF;
END $$;

-- 4. Create the Out-of-Band Admin Promotion Stored Procedure (Security Definer, owned by postgres)
CREATE OR REPLACE PROCEDURE public.promote_user_to_admin(target_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(TRIM(target_email))) THEN
    RAISE EXCEPTION 'User with email % does not exist. The user must sign in with Google first.', target_email;
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
