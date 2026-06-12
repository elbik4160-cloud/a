import { Text, View, StyleSheet } from "react-native";

export default function HomePage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRM Mobile</Text>
      <Text style={styles.subtitle}>Welcome to the mobile app scaffold.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f9fafb"
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: "#4b5563"
  }
});
