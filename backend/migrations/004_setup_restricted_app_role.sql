-- ==============================================================================
-- KUMBHAKARAN PLATFORM - RESTRICTED APPLICATION ROLE CONFIGURATION
-- Run this in Supabase SQL Editor as 'postgres' superuser
-- ==============================================================================

-- 1. Create the restricted application role (replace PASSWORD with your secure password)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kumbhakaran_app') THEN
    CREATE ROLE kumbhakaran_app WITH LOGIN PASSWORD 'ChangeMeAppPassword2026!';
  END IF;
END $$;

-- 2. Grant basic connection and schema usage
GRANT CONNECT ON DATABASE postgres TO kumbhakaran_app;
GRANT USAGE ON SCHEMA public TO kumbhakaran_app;

-- 3. Grant table permissions (Application DML only, NO DDL)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kumbhakaran_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kumbhakaran_app;

-- Ensure future tables created by migrations also grant to kumbhakaran_app
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kumbhakaran_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO kumbhakaran_app;

-- 4. CRITICAL: Restrict UPDATE permissions on the `users` table
-- Revoke full UPDATE on users table
REVOKE UPDATE ON public.users FROM kumbhakaran_app;

-- Grant UPDATE ONLY on non-sensitive profile columns (omitting 'role' and 'id')
GRANT UPDATE (name, avatar_url, phone, last_logout_at, updated_at) 
ON public.users TO kumbhakaran_app;

-- Ensure kumbhakaran_app cannot execute promote_user_to_admin procedure
REVOKE EXECUTE ON PROCEDURE public.promote_user_to_admin(TEXT) FROM kumbhakaran_app;
