import { supabase } from "./supabase";

// ---- Types ----------------------------------------------------------------

interface OsmCourtInput {
  osm_id: number;
  name: string;
  lat: number;
  lon: number;
  hoop_count: number | null;
  surface: string | null;
  indoor: boolean;
}

// ---- Sync -----------------------------------------------------------------

/** Set of OSM IDs that have already been synced this session */
let syncedOsmIds = new Set<number>();

/**
 * Sync a batch of courts from OSM/Overpass to the Supabase `courts` table
 * via the `upsert_courts_from_osm` RPC function.
 *
 * Fire-and-forget — errors are logged, never thrown. Deduplicates by `osm_id`
 * within the session so the same courts aren't sent to the DB repeatedly.
 */
export async function syncCourtsToSupabase(
  features: GeoJSON.Feature[],
): Promise<void> {
  // Filter to features with OSM IDs, extract the fields we need
  const inputs: OsmCourtInput[] = [];

  for (const feature of features) {
    const props = feature.properties as Record<string, unknown> | undefined;
    if (!props) continue;

    const osmId = props.id as number | undefined;
    if (!osmId) continue;

    // Skip if already synced this session
    if (syncedOsmIds.has(osmId)) continue;

    const geom = feature.geometry as GeoJSON.Point | undefined;
    if (!geom?.coordinates) continue;

    inputs.push({
      osm_id: osmId,
      name:
        (props.name as string)?.trim() || `Court #${osmId}`,
      lon: geom.coordinates[0],
      lat: geom.coordinates[1],
      hoop_count: (props.hoop_count as number) ?? null,
      surface: (props.surface as string) ?? null,
      indoor: (props.indoor as boolean) ?? false,
    });

    // Mark as synced immediately (don't wait for RPC result — the
    // DB's ON CONFLICT DO NOTHING handles actual dedup)
    syncedOsmIds.add(osmId);
  }

  if (inputs.length === 0) return;

  try {
    console.log(`[courtSync] Upserting ${inputs.length} courts…`);
    const { error } = await supabase.rpc("upsert_courts_from_osm", {
      courts_json: inputs,
    });

    if (error) {
      console.warn("[courtSync] RPC error:", error.message);
    }
  } catch (err) {
    console.warn("[courtSync] Sync failed:", err);
  }
}

/**
 * Reset the sync dedup state. Useful if the user travels to a new area
 * and the in-memory set has grown large. Called automatically when the
 * map bounds change to a completely non-overlapping area.
 */
export function resetSyncDedup(): void {
  syncedOsmIds = new Set<number>();
}
