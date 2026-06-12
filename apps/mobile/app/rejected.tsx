import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "../hooks/use-auth-store";

export default function RejectedScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Rejected</Text>
      <Text style={styles.message}>
        Hello {user?.name || "there"}, unfortunately your account application has been rejected.
      </Text>
      <Text style={styles.subtext}>
        If you believe this is an error, please contact an administrator.
      </Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
    color: "#ef4444",
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
    marginBottom: 32,
  },
  logoutButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#666",
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
