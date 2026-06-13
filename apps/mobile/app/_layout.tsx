import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore, hydrateAuth } from "../hooks/use-auth-store";
import { ErrorBoundary } from "../components/error-boundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}

function AuthGate() {
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      hydrateAuth();
    }
  }, [isHydrated]);

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <AuthGate />
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="lead/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="client/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="lead/new" options={{ presentation: "modal" }} />
              <Stack.Screen name="client/new" options={{ presentation: "modal" }} />
              <Stack.Screen name="pending" />
              <Stack.Screen name="rejected" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="admin/users" />
              <Stack.Screen name="admin/approvals" />
              <Stack.Screen name="admin/audit" />
              <Stack.Screen name="admin/permissions" />
            </Stack>
          </ErrorBoundary>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
});
