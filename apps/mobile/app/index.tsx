import { Redirect } from "expo-router";
import { useAuthStore } from "../hooks/use-auth-store";

export default function Index() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated || isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (user.status === "pending") {
    return <Redirect href="/pending" />;
  }

  if (user.status === "rejected") {
    return <Redirect href="/rejected" />;
  }

  return <Redirect href="/(tabs)" />;
}
