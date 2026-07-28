import {
  Camera,
  Map,
  UserLocation,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, useColorScheme } from "react-native";

const DEFAULT_COORDINATE: [number, number] = [-122.4194, 37.7749]; // San Francisco
const MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
const MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const cameraRef = useRef<CameraRef>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

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
    <Map
      mapStyle={colorScheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
      style={styles.map}
    >
      <Camera
        ref={cameraRef}
        pitch={60}
        bearing={-20}
        zoom={15}
        initialViewState={{ center: DEFAULT_COORDINATE }}
        trackUserLocation={permissionGranted ? "default" : undefined}
      />
      {permissionGranted && (
        <>
          <UserLocation />
          <Pressable
            style={styles.recenterButton}
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
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  recenterButton: {
    position: "absolute",
    bottom: 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
