import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function SignUpScreen() {
  const signUp = useAuth((s) => s.signUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignUp() {
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to sign up");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8 bg-white">
        <Text className="text-2xl font-bold">Check your email</Text>
        <Text className="text-base text-gray-600 text-center">
          We've sent a confirmation link to {email}. Please verify your account,
          then sign in.
        </Text>
        <Link href="/(auth)/sign-in" className="text-blue-600 text-sm mt-4">
          Back to sign in
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 bg-white">
      <Text className="text-3xl font-bold mb-8">Create Account</Text>

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
        textContentType="newPassword"
        editable={!loading}
      />

      <TextInput
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base"
        placeholder="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        textContentType="newPassword"
        editable={!loading}
      />

      <Pressable
        className={`w-full py-3 rounded-xl items-center ${
          loading ? "bg-blue-400" : "bg-blue-600"
        }`}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? "Creating account…" : "Sign Up"}
        </Text>
      </Pressable>

      <Link href="/(auth)/sign-in" className="text-blue-600 text-sm mt-4">
        Already have an account? Sign in
      </Link>
    </View>
  );
}
