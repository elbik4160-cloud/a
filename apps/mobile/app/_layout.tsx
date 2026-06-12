import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";

export default function Layout() {
  return (
    <SafeAreaView style={styles.container}>
      <Slot />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});
