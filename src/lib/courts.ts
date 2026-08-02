// ---- Types ----------------------------------------------------------------

export interface CourtProperties {
  id: number; // OSM node/way ID
  name: string;
  hoop_count: number | null;
  surface: string | null;
  indoor: boolean;
  osm_type: string; // "node" | "way" | "relation"
}

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

// ---- Overpass API ---------------------------------------------------------

const OVERPASS_URL = "https://overpass.kumi.systems/api/interpreter";

/**
 * Build an Overpass QL query for basketball courts within the given bounds.
 * Queries nodes, ways, and relations with sport=basketball + leisure=pitch.
 * Uses `out center` for ways/relations to get centroid coordinates.
 */
function buildOverpassQuery(bounds: Bounds): string {
  const { west, south, east, north } = bounds;
  // Slightly expand the bbox so courts just outside the viewport edge show up
  const pad = 0.005;
  const w = west - pad;
  const s = south - pad;
  const e = east + pad;
  const n = north + pad;

  return `
    [out:json][timeout:15];
    (
      node["leisure"="pitch"]["sport"="basketball"](${s},${w},${n},${e});
      way["leisure"="pitch"]["sport"="basketball"](${s},${w},${n},${e});
      relation["leisure"="pitch"]["sport"="basketball"](${s},${w},${n},${e});
    );
    out center;
  `.trim().replace(/\n\s*/g, ""); // minify to save bytes
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

/**
 * Convert an Overpass element to a GeoJSON Feature with Hoops properties.
 * Returns null for elements without usable coordinates.
 */
function elementToFeature(el: OverpassElement): GeoJSON.Feature | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  const tags = el.tags ?? {};

  const props: CourtProperties = {
    id: el.id,
    name: tags.name ?? tags.alt_name ?? "Basketball Court",
    hoop_count: tags.hoops ? parseInt(tags.hoops, 10) || null : null,
    surface: tags.surface ?? null,
    indoor: tags.indoor === "yes" || tags.building === "yes",
    osm_type: el.type,
  };

  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lon, lat] },
    properties: props,
  };
}

/**
 * Fetch basketball courts within the given bounding box from the Overpass API.
 * Returns a GeoJSON FeatureCollection, or an empty one on error.
 */
export async function fetchCourtsInBounds(
  bounds: Bounds,
): Promise<GeoJSON.FeatureCollection> {
  const query = buildOverpassQuery(bounds);

  try {
    console.log("[courts] Fetching from Overpass...");
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
    });

    if (!res.ok) {
      console.warn(`Overpass returned ${res.status}`);
      return { type: "FeatureCollection", features: [] };
    }

    const { elements } = (await res.json()) as OverpassResponse;

    const features = elements
      .map(elementToFeature)
      .filter((f): f is GeoJSON.Feature => f !== null);

    return { type: "FeatureCollection", features };
  } catch (err) {
    console.warn("Overpass fetch failed:", err);
    return { type: "FeatureCollection", features: [] };
  }
}
