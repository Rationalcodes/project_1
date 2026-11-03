-- ==============================================================================
-- KUMBHAKARAN PLATFORM - INCREMENTAL MIGRATION 002
-- Add owner_id to salons, owner indexes, and RLS policies
-- ==============================================================================

-- 1. Add owner_id to salons table if not already present
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS owner_id VARCHAR(64);

-- 2. Create B-Tree index on owner_id for fast owner lookups
CREATE INDEX IF NOT EXISTS idx_salons_owner_id 
ON salons (owner_id);

-- 3. Ensure status column default is 'active' and indexed
CREATE INDEX IF NOT EXISTS idx_salons_status 
ON salons (status);

-- 4. Audit comments
COMMENT ON COLUMN salons.owner_id IS 'Owner/partner account identifier associated with this salon';
COMMENT ON COLUMN salons.location IS 'PostGIS WGS84 geography point (SRID 4326) indexed with GiST';
