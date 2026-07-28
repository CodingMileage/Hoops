import { Text, View, StyleSheet } from "react-native";

export default function RankingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ranking</Text>
      <Text style={styles.subtitle}>Player leaderboards</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
