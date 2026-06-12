import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../hooks/use-auth-store";
import { router } from "expo-router";
import { ChevronLeft, Activity, User, Clock } from "lucide-react-native";
import { Card, CardContent } from "../../../components/card";

interface AuditLog {
  id: number;
  userId?: string;
  userName?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}

async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("createdAt", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export default function AuditScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [refreshing, setRefreshing] = useState(false);

  const { data: logs, refetch } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: getAuditLogs,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (user.role !== "admin") {
    return (
      <View style={styles.container}>
        <View style={styles.denied}>
          <Text style={styles.deniedText}>Access denied</Text>
        </View>
      </View>
    );
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("reject")) return "#ef4444";
    if (action.includes("create") || action.includes("approve")) return "#22c55e";
    if (action.includes("update")) return "#3b82f6";
    return "#888";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Logs</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#666" />}
        renderItem={({ item }) => (
          <Card style={styles.logCard}>
            <CardContent style={styles.logContent}>
              <View style={styles.logIcon}>
                <Activity size={16} color={getActionColor(item.action)} />
              </View>
              <View style={styles.logInfo}>
                <Text style={styles.logAction}>{item.action}</Text>
                {item.userName && (
                  <View style={styles.userRow}>
                    <User size={12} color="#666" />
                    <Text style={styles.logUser}>{item.userName}</Text>
                  </View>
                )}
                {item.entity && (
                  <Text style={styles.logEntity}>
                    {item.entity} {item.entityId && `#${item.entityId.slice(0, 8)}`}
                  </Text>
                )}
                {item.details && (
                  <Text style={styles.logDetails} numberOfLines={2}>
                    {item.details}
                  </Text>
                )}
              </View>
              <Text style={styles.logTime}>{formatDateTime(item.createdAt)}</Text>
            </CardContent>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Activity size={48} color="#333" />
            <Text style={styles.emptyText}>No audit logs</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  logCard: {},
  logContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  logInfo: {
    flex: 1,
    gap: 4,
  },
  logAction: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logUser: {
    fontSize: 12,
    color: "#666",
  },
  logEntity: {
    fontSize: 12,
    color: "#3b82f6",
  },
  logDetails: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
  },
  logTime: {
    fontSize: 11,
    color: "#444",
  },
  empty: {
    padding: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
  denied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deniedText: {
    color: "#ef4444",
    fontSize: 16,
  },
});
