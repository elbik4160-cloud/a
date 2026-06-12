import { View, Text, StyleSheet } from "react-native";
import { useAuthStore } from "../hooks/use-auth-store";

export default function PendingScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Pending</Text>
      <Text style={styles.message}>
        Hello {user?.name || "there"}, your account is waiting for admin approval.
      </Text>
      <Text style={styles.subtext}>
        You will be notified once your account is approved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
