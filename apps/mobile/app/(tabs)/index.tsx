import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Users, Lock, MessageSquare, ShieldAlert, Plus, TrendingUp } from "lucide-react-native";
import { Link } from "expo-router";
import { StatCard } from "../../components/stat-card";
import { ActivityFeed } from "../../components/activity-feed";

async function getDashboardStats(userId: string, role: string) {
  const [clientsResult, locksResult, feedbackResult, pendingResult, leadsResult] = await Promise.all([
    role === "admin"
      ? supabase.from("clients").select("id", { count: "exact", head: true })
      : supabase.from("clients").select("id", { count: "exact", head: true }).eq("createdBy", userId),
    supabase.from("client_locks").select("id", { count: "exact", head: true }),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("salesUserId", userId),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("assignedToId", userId),
  ]);

  const recentFeedback = await supabase
    .from("feedback")
    .select("id, salesName, notes, clientStatus, createdAt")
    .order("createdAt", { ascending: false })
    .limit(5);

  return {
    totalClients: clientsResult.count || 0,
    activeLocks: locksResult.count || 0,
    myFeedback: feedbackResult.count || 0,
    pendingUsers: pendingResult.count || 0,
    myLeads: leadsResult.count || 0,
    recentFeedback: recentFeedback.data || [],
  };
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", user.id, user.role],
    queryFn: () => getDashboardStats(user.id, user.role),
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
          <StatCard
            title={isAdmin ? "All Clients" : "My Clients"}
            value={isAdmin ? stats?.totalClients ?? 0 : stats?.myLeads ?? 0}
            icon={Users}
            color="#3b82f6"
          />
          <StatCard
            title="Active Now"
            value={stats?.activeLocks ?? 0}
            icon={Lock}
            color="#f59e0b"
          />
          <StatCard
            title="My Feedback"
            value={stats?.myFeedback ?? 0}
            icon={MessageSquare}
            color="#22c55e"
          />
          {isAdmin ? (
            <StatCard
              title="Pending Users"
              value={stats?.pendingUsers ?? 0}
              icon={ShieldAlert}
              color="#ef4444"
            />
          ) : (
            <StatCard
              title="My Leads"
              value={stats?.myLeads ?? 0}
              icon={TrendingUp}
              color="#8b5cf6"
            />
          )}
        </View>

        {isAdmin && stats?.pendingUsers ? (
          stats.pendingUsers > 0 && (
            <TouchableOpacity style={styles.warningCard}>
              <ShieldAlert size={20} color="#f59e0b" />
              <Text style={styles.warningText}>
                {stats.pendingUsers} pending account request(s)
              </Text>
            </TouchableOpacity>
          )
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <ActivityFeed data={stats?.recentFeedback ?? []} isLoading={isLoading} />
        </View>
      </ScrollView>
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
});
