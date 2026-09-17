import { useCallback, useMemo } from "react";
import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import type { NativeSyntheticEvent } from "react-native";
import type { PressEventWithFeatures } from "@maplibre/maplibre-react-native";
import type { CourtProperties } from "@/lib/courts";

const SOURCE_ID = "courts-source";
const CLUSTER_LAYER_ID = "courts-clusters";
const CLUSTER_COUNT_LAYER_ID = "courts-cluster-count";
const COURT_POINT_LAYER_ID = "courts-points";

interface CourtMarkersProps {
  /** GeoJSON FeatureCollection of basketball courts (from Overpass API) */
  courts: GeoJSON.FeatureCollection;
  /** Called when the user taps an individual court marker (not a cluster) */
  onCourtPress?: (court: CourtProperties) => void;
}

/**
 * Renders basketball court markers on a MapLibre map with clustering.
 *
 * Must be rendered as a child of <Map>. Uses a GeoJSONSource with
 * built-in clustering, CircleLayer for points, and SymbolLayer for
 * cluster counts.
 *
 * Tapping an individual court fires `onCourtPress` with the court's
 * properties. Tapping a cluster is ignored (no expansion yet).
 */
export function CourtMarkers({ courts, onCourtPress }: CourtMarkersProps) {
  const geoJSON = useMemo(() => courts, [courts]);

  const handlePress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      if (!onCourtPress) return;

      const features = event.nativeEvent?.features;
      if (!features?.length) return;

      const feature = features[0];
      const props = feature.properties as Record<string, unknown> | undefined;

      // Ignore cluster taps (clusters have a `point_count` property)
      if (props?.point_count != null) return;

      // Ignore features without OSM-style properties
      if (!props?.id) return;

      onCourtPress(props as unknown as CourtProperties);
    },
    [onCourtPress],
  );

  if (!geoJSON.features || geoJSON.features.length === 0) return null;

  return (
    <GeoJSONSource
      id={SOURCE_ID}
      data={geoJSON}
      cluster
      clusterRadius={50}
      clusterMaxZoom={14}
      onPress={handlePress}
    >
      {/* Clustered circles — sized and colored by point count */}
      <Layer
        type="circle"
        id={CLUSTER_LAYER_ID}
        source={SOURCE_ID}
        filter={["has", "point_count"]}
        paint={{
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#007AFF", // blue for small clusters
            10,
            "#FF9500", // orange for medium
            30,
            "#FF3B30", // red for large
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10,
            25,
            30,
            30,
            50,
            35,
          ],
          "circle-opacity": 0.84,
        }}
      />

      {/* Cluster count label */}
      <Layer
        type="symbol"
        id={CLUSTER_COUNT_LAYER_ID}
        source={SOURCE_ID}
        filter={["has", "point_count"]}
        layout={{
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
        }}
        paint={{
          "text-color": "#FFFFFF",
          "text-halo-color": "rgba(0,0,0,0.3)",
          "text-halo-width": 1,
        }}
      />

      {/* Individual court points */}
      <Layer
        type="circle"
        id={COURT_POINT_LAYER_ID}
        source={SOURCE_ID}
        filter={["!", ["has", "point_count"]]}
        paint={{
          "circle-color": "#34C759",
          "circle-radius": 7,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 2,
          "circle-opacity": 0.9,
        }}
      />
    </GeoJSONSource>
  );
}
