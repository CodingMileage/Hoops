-- Migration 001: PostGIS + courts table for Hoops enrichment data.
-- Run this in the Supabase SQL Editor.
--
-- Court DISCOVERY (locations + names) comes from OSM via Overpass API.
-- This table stores Hoops-specific ENRICHMENT: photos, ratings, check-ins,
-- user-submitted courts, and any metadata OSM doesn't have.

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create courts table
CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id BIGINT UNIQUE,        -- OSM node/way/relation ID (links to OSM data)
  name TEXT,
  location GEOGRAPHY(POINT, 4326),
  hoop_count INT,
  surface TEXT,
  indoor BOOLEAN DEFAULT false,
  -- Hoops-specific enrichment (future phases)
  photo_url TEXT,
  avg_rating NUMERIC(3,2),
  check_in_count INT DEFAULT 0,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Spatial index
CREATE INDEX IF NOT EXISTS courts_location_idx ON courts USING GIST (location);

-- 4. RLS
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courts"
  ON courts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert courts"
  ON courts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_courts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courts_updated_at
  BEFORE UPDATE ON courts
  FOR EACH ROW
  EXECUTE FUNCTION update_courts_updated_at();
