import type { CourtProperties } from "@/lib/courts";
import { BottomSheet } from "@expo/ui";
import { Text, View, useWindowDimensions } from "react-native";

// ---- Props -----------------------------------------------------------------

interface CourtDetailSheetProps {
  court: CourtProperties | null;
  isPresented: boolean;
  onDismiss: () => void;
}

// ---- Helpers ----------------------------------------------------------------

function surfaceLabel(surface: string | null): string {
  if (!surface) return "Unknown";
  // Map common OSM surface values to human-readable labels
  const map: Record<string, string> = {
    asphalt: "Asphalt",
    concrete: "Concrete",
    asphalt_concrete: "Asphalt / Concrete",
    tartan: "Tartan",
    acrylic: "Acrylic",
    wood: "Wood",
    hardwood: "Hardwood",
    synthetic: "Synthetic",
    grass: "Grass",
    dirt: "Dirt",
    clay: "Clay",
    gravel: "Gravel",
    paving_stones: "Paving Stones",
  };
  return map[surface] ?? surface.charAt(0).toUpperCase() + surface.slice(1);
}

// ---- Component --------------------------------------------------------------

export function CourtDetailSheet({
  court,
  isPresented,
  onDismiss,
}: CourtDetailSheetProps) {
  const { width } = useWindowDimensions();

  if (!court) return null;

  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={["half"]}
      showDragIndicator
    >
      <View style={{ width }} className="px-10 pt-4 pb-8 pr-20">
        {/* Court name */}
        <View className="gap-1">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {court.name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            OSM {court.osm_type} #{court.id}
          </Text>
        </View>

        {/* Badge row */}
        <View className="flex-row gap-2">
          <View className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
            <Text className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {court.indoor ? "Indoor" : "Outdoor"}
            </Text>
          </View>

          {court.hoop_count != null && (
            <View className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900">
              <Text className="text-sm font-semibold text-green-800 dark:text-green-200">
                {court.hoop_count} {court.hoop_count === 1 ? "Hoop" : "Hoops"}
              </Text>
            </View>
          )}

          {court.surface && (
            <View className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900">
              <Text className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {surfaceLabel(court.surface)}
              </Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View className="gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
          <DetailRow label="Surface" value={surfaceLabel(court.surface)} />
          <DetailRow
            label="Hoops"
            value={court.hoop_count != null ? String(court.hoop_count) : "—"}
          />
          <DetailRow label="Type" value={court.indoor ? "Indoor" : "Outdoor"} />
          <DetailRow
            label="Source"
            value={`OpenStreetMap (${court.osm_type})`}
          />
        </View>

        <View className="gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Coming Soon
          </Text>

          <View className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Text className="text-gray-400 dark:text-gray-600 text-sm">
              📸 Court Photos
            </Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Text className="text-gray-400 dark:text-gray-600 text-sm">
                ⭐ Ratings
              </Text>
            </View>
            <View className="flex-1 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Text className="text-gray-400 dark:text-gray-600 text-sm">
                📍 Check-ins
              </Text>
            </View>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

// ---- Detail Row -------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-sm text-gray-500 dark:text-gray-400">{label}</Text>
      <Text className="text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </Text>
    </View>
  );
}
