import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function SignInScreen() {
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message ?? "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 bg-white">
      <Text className="text-3xl font-bold mb-8">Hoops</Text>

      {error && (
        <Text className="text-red-600 text-sm text-center">{error}</Text>
      )}

      <TextInput
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        editable={!loading}
      />

      <TextInput
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        editable={!loading}
      />

      <Pressable
        className={`w-full py-3 rounded-xl items-center ${
          loading ? "bg-blue-400" : "bg-blue-600"
        }`}
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? "Signing in…" : "Sign In"}
        </Text>
      </Pressable>

      <Link href="/(auth)/sign-up" className="text-blue-600 text-sm mt-4">
        Don't have an account? Sign up
      </Link>
    </View>
  );
}
