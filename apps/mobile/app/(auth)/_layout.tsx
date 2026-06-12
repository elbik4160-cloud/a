import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Redirect } from "expo-router";

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) return null;
  if (user?.status === "approved") return <Redirect href="/(tabs)" />;
  if (user?.status === "pending") return <Redirect href="/pending" />;
  if (user?.status === "rejected") return <Redirect href="/rejected" />;

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
