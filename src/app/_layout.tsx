import "../../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Slot, router, usePathname } from "expo-router";
import { useColorScheme, View, Text, ActivityIndicator } from "react-native";
import { useAuth, useInitializeAuth } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useInitializeAuth();

  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);
  const pathname = usePathname();
  const isAuthGroup = pathname.startsWith("/(auth)");
  const navigatingRef = useRef(false);

  useEffect(() => {
    if (isLoading || navigatingRef.current) return;

    if (!user && !isAuthGroup) {
      navigatingRef.current = true;
      router.replace("/(auth)/sign-in");
    } else if (user && isAuthGroup) {
      navigatingRef.current = true;
      router.replace("/(tabs)");
    } else {
      navigatingRef.current = false;
    }
  }, [user, isLoading, isAuthGroup]);

  // Show splash/loading while checking initial session
  if (isLoading) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Slot />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
