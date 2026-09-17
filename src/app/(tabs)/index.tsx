import {
  Camera,
  Map,
  UserLocation,
  type CameraRef,
  type MapRef,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  Text,
  useColorScheme,
} from "react-native";
import { CourtMarkers } from "@/components/CourtMarkers";
import { CourtDetailSheet } from "@/components/CourtDetailSheet";
import { useMapBounds } from "@/hooks/useMapBounds";
import { useCourtsInBounds } from "@/hooks/useCourtsInBounds";
import { syncCourtsToSupabase } from "@/lib/courtSync";
import type { CourtProperties } from "@/lib/courts";

const DEFAULT_COORDINATE: [number, number] = [-122.4194, 37.7749]; // San Francisco
const MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
const MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

const emptyCollection: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtProperties | null>(null);

  // Pan-to-search: extract debounced bounds from map movement
  const { bounds, isReady, handleRegionChange } = useMapBounds();

  // Fetch courts from Overpass API when bounds change
  const { data: courts = emptyCollection, isFetching } = useCourtsInBounds(
    isReady ? bounds : null,
  );

  // Sync discovered courts to Supabase so enrichment data can accumulate
  useEffect(() => {
    if (courts.features && courts.features.length > 0) {
      syncCourtsToSupabase(courts.features);
    }
  }, [courts.features]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionGranted(status === "granted");
    })();
  }, []);

  const recenterOnUser = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    cameraRef.current?.easeTo({
      center: [location.coords.longitude, location.coords.latitude],
      zoom: 15,
      pitch: 60,
      bearing: -20,
      duration: 800,
    });
  }, []);

  return (
    <>
      <Map
        ref={mapRef}
        mapStyle={colorScheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
        className="flex-1"
        onRegionDidChange={handleRegionChange}
      >
        <Camera
          ref={cameraRef}
          pitch={60}
          bearing={-20}
          zoom={15}
          initialViewState={{ center: DEFAULT_COORDINATE }}
          trackUserLocation={permissionGranted ? "default" : undefined}
        />

        {/* Court markers — only rendered when zoomed in enough */}
        {isReady && (
          <CourtMarkers courts={courts} onCourtPress={setSelectedCourt} />
        )}

        {/* Loading indicator when fetching new courts */}
        {isFetching && (
          <Text className="absolute top-[60px] self-center bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl overflow-hidden">Finding courts…</Text>
        )}

        {/* Zoom gate: prompt user to zoom in */}
        {!isReady && (
          <Text className="absolute top-[60px] self-center bg-black/75 text-white text-sm font-semibold px-4 py-2 rounded-[20px] overflow-hidden">🔍 Zoom in to find courts</Text>
        )}

        {permissionGranted && (
          <>
            <UserLocation />
            <Pressable
              className="absolute bottom-10 right-4 w-11 h-11 rounded-full bg-white items-center justify-center shadow-md"
              onPress={recenterOnUser}
              accessibilityLabel="Recenter on your location"
            >
              <SymbolView
                name="location.fill"
                size={22}
                tintColor="#007AFF"
              />
            </Pressable>
          </>
        )}
      </Map>

      {/* Court detail bottom sheet — rendered outside the Map so it overlays properly */}
      <CourtDetailSheet
        court={selectedCourt}
        isPresented={selectedCourt !== null}
        onDismiss={() => setSelectedCourt(null)}
      />
    </>
  );
}

