import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchCourtsInBounds, type Bounds } from "@/lib/courts";

/** How long before cached court data is considered stale */
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * React Query hook that fetches basketball courts from the Overpass API
 * for the given map bounds.
 *
 * Uses `placeholderData: keepPreviousData` so the previous set of courts
 * stays visible while new ones load — essential for smooth map transitions.
 *
 * The query is disabled when bounds is null (below min zoom or no region change yet).
 */
export function useCourtsInBounds(bounds: Bounds | null) {
  return useQuery({
    queryKey: ["courts", bounds],
    queryFn: async () => {
      if (!bounds) return { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection;
      return fetchCourtsInBounds(bounds);
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
    enabled: bounds !== null,
  });
}
