-- Additive SmartQueue assistance metadata. Existing queue and salon records are preserved.
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS smart_queue_geofence_radius_meters INTEGER NOT NULL DEFAULT 100;

ALTER TABLE public.salon_queue_entries
  ADD COLUMN IF NOT EXISTS check_in_method VARCHAR(20) NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS party_size INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS location_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS arrival_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_location_observed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_location_accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS outside_observation_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_outside_observed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS departure_detected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS departure_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS departure_confirmation_source VARCHAR(30),
  ADD COLUMN IF NOT EXISTS departure_review_required BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_smart_queue_geofence_radius'
  ) THEN
    ALTER TABLE public.salons
      ADD CONSTRAINT chk_smart_queue_geofence_radius
      CHECK (smart_queue_geofence_radius_meters BETWEEN 50 AND 500);
  END IF;
END $$;
