import { Text, View } from "react-native";

export default function RankingScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Text className="text-3xl font-bold">Ranking</Text>
      <Text className="text-base text-gray-500">Player leaderboards</Text>
    </View>
  );
}
