import { View, Text, StyleSheet } from "react-native";
import { Video as LucideIcon } from "lucide-react-native";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <View style={[styles.card, { width: "48%" }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#262626",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  title: {
    fontSize: 13,
    color: "#888",
  },
});
