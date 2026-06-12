import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface ActivityItem {
  id: number;
  salesName: string;
  notes: string | null;
  clientStatus: string;
  createdAt: string;
}

interface ActivityFeedProps {
  data: ActivityItem[];
  isLoading?: boolean;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    Sold: "#22c55e",
    Interested: "#3b82f6",
    "Not Interested": "#ef4444",
    "Follow Up": "#f59e0b",
    New: "#8b5cf6",
    Default: "#666",
  };
  return colors[status] || colors.Default;
}

export function ActivityFeed({ data, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No recent activity</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemContent}>
            <Text style={styles.salesName}>{item.salesName}</Text>
            <Text style={styles.notes} numberOfLines={1}>
              {item.notes || "No notes"}
            </Text>
          </View>
          <View style={styles.itemMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.clientStatus) + "20" }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.clientStatus) }]}>
                {item.clientStatus}
              </Text>
            </View>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loading: {
    padding: 40,
    alignItems: "center",
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
  item: {
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#262626",
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  salesName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  notes: {
    fontSize: 12,
    color: "#666",
  },
  itemMeta: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  date: {
    fontSize: 11,
    color: "#555",
  },
});
