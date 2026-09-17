-- Migration 002: Batch upsert function for bridging OSM discovery → Supabase enrichment.
-- Run this in the Supabase SQL Editor.
--
-- Called from the client after fetching courts from the Overpass API.
-- Takes a JSONB array of court objects and inserts rows that don't exist yet,
-- linking them via osm_id so enrichment data (photos, ratings, check-ins)
-- can accumulate over time.
--
-- NOTE: OSM node, way, and relation IDs come from separate sequences and CAN
-- numerically collide (e.g., node 123456 and way 123456 both exist). The
-- current schema uses osm_id as a plain UNIQUE constraint. For now, DO NOTHING
-- means the first element wins; a future migration should add osm_type and
-- target (osm_id, osm_type) in the conflict clause.

CREATE OR REPLACE FUNCTION upsert_courts_from_osm(courts_json JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  INSERT INTO courts (osm_id, name, location, hoop_count, surface, indoor)
  SELECT
    t.osm_id,
    t.name,
    ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326)::GEOGRAPHY,
    t.hoop_count,
    t.surface,
    t.indoor
  FROM jsonb_to_recordset(courts_json) AS t(
    osm_id  BIGINT,
    name    TEXT,
    lat     DOUBLE PRECISION,
    lon     DOUBLE PRECISION,
    hoop_count INT,
    surface TEXT,
    indoor  BOOLEAN
  )
  ON CONFLICT (osm_id) DO NOTHING;
END;
$$;
