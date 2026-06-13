import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Users, Lock, MessageSquare, ShieldAlert, TrendingUp, Plus } from "lucide-react-native";
import { Link } from "expo-router";
import { StatCard } from "../../components/stat-card";
import { Card, CardContent } from "../../components/card";

interface DashboardStats {
  totalClients: number;
  myClients: number;
  activeLocks: number;
  myFeedback: number;
  pendingUsers: number;
  myLeads: number;
  recentFeedback: Array<{
    id: number;
    salesName: string;
    notes: string | null;
    clientStatus: string;
    createdAt: string;
  }>;
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ["dashboard", user.id, user.role],
    queryFn: async () => {
      const data = await api.stats.dashboard();
      return data;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const isAdmin = user.role === "admin";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user.name}</Text>
          <Text style={styles.subtitle}>Sales Activity Overview</Text>
        </View>
        <Link href="/lead/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#666" />}
      >
        <View style={styles.statsGrid}>
          {isAdmin ? (
            <StatCard title="All Clients" value={stats?.totalClients ?? 0} icon={Users} color="#3b82f6" />
          ) : (
            <StatCard title="My Clients" value={stats?.myClients ?? 0} icon={Users} color="#3b82f6" />
          )}
          <StatCard title="Active Now" value={stats?.activeLocks ?? 0} icon={Lock} color="#f59e0b" />
          <StatCard title="My Feedback" value={stats?.myFeedback ?? 0} icon={MessageSquare} color="#22c55e" />
          {isAdmin ? (
            <StatCard title="Pending Users" value={stats?.pendingUsers ?? 0} icon={ShieldAlert} color="#ef4444" />
          ) : (
            <StatCard title="My Leads" value={stats?.myLeads ?? 0} icon={TrendingUp} color="#8b5cf6" />
          )}
        </View>

        {isAdmin && (stats?.pendingUsers ?? 0) > 0 && (
          <Link href="/admin/approvals" asChild>
            <TouchableOpacity style={styles.warningCard}>
              <ShieldAlert size={20} color="#f59e0b" />
              <Text style={styles.warningText}>
                {stats?.pendingUsers} pending account requests
              </Text>
            </TouchableOpacity>
          </Link>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Feedback</Text>
          {(stats?.recentFeedback?.length ?? 0) === 0 ? (
            <Card>
              <CardContent>
                <Text style={styles.emptyText}>No recent feedback</Text>
              </CardContent>
            </Card>
          ) : (
            stats?.recentFeedback?.map((fb) => (
              <Card key={fb.id} style={styles.feedbackCard}>
                <CardContent style={styles.feedbackContent}>
                  <View style={styles.feedbackInfo}>
                    <Text style={styles.feedbackName}>{fb.salesName}</Text>
                    <Text style={styles.feedbackNotes} numberOfLines={1}>
                      {fb.notes || "No notes"}
                    </Text>
                  </View>
                  <View style={styles.feedbackMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fb.clientStatus) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(fb.clientStatus) }]}>
                        {fb.clientStatus}
                      </Text>
                    </View>
                    <Text style={styles.feedbackDate}>{formatDate(fb.createdAt)}</Text>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    Sold: "#22c55e",
    Interested: "#3b82f6",
    "Not Interested": "#ef4444",
    "Follow Up": "#f59e0b",
    New: "#8b5cf6",
  };
  return colors[status] || "#666";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#3b82f6",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  warningCard: {
    backgroundColor: "#f59e0b20",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f59e0b40",
  },
  warningText: {
    flex: 1,
    color: "#f59e0b",
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  feedbackCard: {
    marginBottom: 0,
  },
  feedbackContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedbackInfo: {
    flex: 1,
    gap: 4,
  },
  feedbackName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  feedbackNotes: {
    fontSize: 12,
    color: "#666",
  },
  feedbackMeta: {
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
  feedbackDate: {
    fontSize: 11,
    color: "#555",
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
});
