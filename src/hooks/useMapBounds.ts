import { useCallback, useRef, useState } from "react";
import type { NativeSyntheticEvent } from "react-native";
import type { ViewStateChangeEvent } from "@maplibre/maplibre-react-native";
import type { Bounds } from "@/lib/courts";

const DEBOUNCE_MS = 400;
const MIN_ZOOM = 12;

export interface MapBoundsState {
  /** The debounced visible bounds, or null until the first region change fires */
  bounds: Bounds | null;
  /** Current zoom level */
  zoom: number;
  /** True once we have valid bounds at or above the minimum zoom */
  isReady: boolean;
}

/**
 * Hook that extracts debounced map bounds from onRegionDidChange events.
 *
 * Returns the debounced bounds + zoom, and a callback to wire to
 * `<Map onRegionDidChange={handleRegionChange} />`.
 *
 * Skips fetches when the new bounds are fully contained within the
 * previously *fetched* bounds (zoom-in case), avoiding redundant queries.
 */
export function useMapBounds() {
  const [state, setState] = useState<MapBoundsState>({
    bounds: null,
    zoom: 0,
    isReady: false,
  });

  // Reference to the bounds that were last *returned* (i.e., triggered a fetch)
  const lastFetchedBoundsRef = useRef<Bounds | null>(null);
  // Debounce timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest raw bounds from the event (updated synchronously)
  const latestRef = useRef<Bounds | null>(null);

  const handleRegionChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      try {
        const { bounds, zoom } = event.nativeEvent;
      const [west, south, east, north] = bounds;

      const newBounds: Bounds = { west, south, east, north };
      latestRef.current = newBounds;

      // Skip if zoom is below threshold — don't even debounce
      if (zoom < MIN_ZOOM) {
        // Clear any pending timer — zoomed out far enough we shouldn't show courts
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setState({ bounds: null, zoom, isReady: false });
        return;
      }

      // Check containment: if new bounds are fully inside the last-fetched
      // bounds, we don't need to re-fetch (user zoomed in or panned within
      // the already-covered area)
      if (lastFetchedBoundsRef.current) {
        const prev = lastFetchedBoundsRef.current;
        if (
          newBounds.west >= prev.west &&
          newBounds.south >= prev.south &&
          newBounds.east <= prev.east &&
          newBounds.north <= prev.north
        ) {
          // Still update zoom in state but keep current bounds
          setState((s) => ({ ...s, zoom, isReady: true }));
          return;
        }
      }

      // Debounce: clear existing timer, set a new one
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        lastFetchedBoundsRef.current = latestRef.current;
        console.log("[useMapBounds] Setting bounds:", latestRef.current, "zoom:", zoom);
        setState({
          bounds: latestRef.current,
          zoom,
          isReady: true,
        });
        timerRef.current = null;
      }, DEBOUNCE_MS);
      } catch (err) {
        console.warn("[useMapBounds] Error in region change handler:", err);
      }
    },
    [],
  );

  return { ...state, handleRegionChange };
}
