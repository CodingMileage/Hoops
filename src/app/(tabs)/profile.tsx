import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const [courts, setCourts] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourts() {
      const { data, error } = await supabase.from("courts").select("*");
      if (error) {
        setError(error.message);
      } else {
        setCourts(data);
      }
    }
    fetchCourts();
  }, []);

  return (
    <View className="flex-1 pt-12 px-4">
      {/* User info */}
      <View className="mb-4">
        <Text className="text-2xl font-bold">Profile</Text>
        <Text className="text-base text-gray-600 mt-1">
          {user?.email ?? "Not signed in"}
        </Text>
        <Text
          className="text-red-600 text-sm font-semibold mt-2"
          onPress={() => signOut()}
        >
          Sign Out
        </Text>
      </View>

      <View className="border-t border-gray-200 pt-4 flex-1">
        <Text className="text-lg font-bold mb-2">
          Courts ({courts?.length ?? "…"})
        </Text>

        {error ? (
          <Text className="text-red-600 text-sm">{error}</Text>
        ) : courts === null ? (
          <Text className="text-gray-500">Loading courts…</Text>
        ) : (
          <FlatList
            data={courts}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text className="text-base text-gray-500">No courts found.</Text>
            }
            renderItem={({ item }) => (
              <View className="py-2 border-b border-gray-200">
                <Text className="text-base font-semibold text-gray-800">
                  {item.name ?? "Unnamed Court"}
                </Text>
                {item.surface && (
                  <Text className="text-sm text-gray-500">
                    Surface: {item.surface}
                  </Text>
                )}
                {item.hoop_count && (
                  <Text className="text-sm text-gray-500">
                    Hoops: {item.hoop_count}
                  </Text>
                )}
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
