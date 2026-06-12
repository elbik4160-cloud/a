import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Link } from "expo-router";
import { Users, ShieldAlert, Activity, Settings, ChevronRight, UserCheck, UserX } from "lucide-react-native";
import { StatCard } from "../../components/stat-card";
import { Card, CardContent } from "../../components/card";
import { Button } from "../../components/button";

async function getAdminStats() {
  const [
    usersCount,
    pendingCount,
    clientsCount,
    leadsCount,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
  ]);

  const pendingUsers = await supabase
    .from("users")
    .select("id, name, email, requestedRole, createdAt")
    .eq("status", "pending")
    .order("createdAt", { ascending: false });

  return {
    totalUsers: usersCount.count || 0,
    pendingApprovals: pendingCount.count || 0,
    totalClients: clientsCount.count || 0,
    totalLeads: leadsCount.count || 0,
    pendingUsers: pendingUsers.data || [],
  };
}

async function approveUser(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ status: "approved" })
    .eq("id", userId);
  if (error) throw error;
}

async function rejectUser(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ status: "rejected" })
    .eq("id", userId);
  if (error) throw error;
}

export default function AdminScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["adminStats"],
    queryFn: getAdminStats,
    enabled: user.role === "admin",
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
          <Text style={styles.deniedTitle}>Access Denied</Text>
          <Text style={styles.deniedText}>You don't have admin privileges.</Text>
        </View>
      </View>
    );
  }

  const menuItems = [
    { icon: Users, title: "Manage Users", href: "/admin/users" as const },
    { icon: ShieldAlert, title: "Approvals", href: "/admin/approvals" as const, badge: stats?.pendingApprovals },
    { icon: Activity, title: "Audit Logs", href: "/admin/audit" as const },
    { icon: Settings, title: "Permissions", href: "/admin/permissions" as const },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#666" />}
      >
        <View style={styles.statsGrid}>
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="#8b5cf6" />
          <StatCard title="Pending" value={stats?.pendingApprovals ?? 0} icon={ShieldAlert} color="#f59e0b" />
          <StatCard title="Clients" value={stats?.totalClients ?? 0} icon={Users} color="#3b82f6" />
          <StatCard title="Leads" value={stats?.totalLeads ?? 0} icon={Activity} color="#22c55e" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {menuItems.map((item) => (
            <Link key={item.title} href={item.href} asChild>
              <TouchableOpacity>
                <Card style={styles.menuCard}>
                  <CardContent style={styles.menuContent}>
                    <View style={styles.menuLeft}>
                      <item.icon size={20} color="#888" />
                      <Text style={styles.menuTitle}>{item.title}</Text>
                    </View>
                    <View style={styles.menuRight}>
                      {item.badge && item.badge > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <ChevronRight size={18} color="#444" />
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        {stats?.pendingUsers && stats.pendingUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>
            {stats.pendingUsers.map((pendingUser) => (
              <Card key={pendingUser.id} style={styles.pendingCard}>
                <CardContent style={styles.pendingContent}>
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingName}>{pendingUser.name}</Text>
                    <Text style={styles.pendingEmail}>{pendingUser.email}</Text>
                    <Text style={styles.pendingRole}>Requested: {pendingUser.requestedRole}</Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => approveUser(pendingUser.id).then(() => refetch())}
                    >
                      <UserCheck size={18} color="#22c55e" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => rejectUser(pendingUser.id).then(() => refetch())}
                    >
                      <UserX size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
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
    marginBottom: 24,
  },
  section: {
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  menuCard: {
    marginBottom: 0,
  },
  menuContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuTitle: {
    fontSize: 15,
    color: "#fff",
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  pendingCard: {
    marginBottom: 0,
    borderColor: "#f59e0b40",
  },
  pendingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingInfo: {
    flex: 1,
    gap: 2,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  pendingEmail: {
    fontSize: 13,
    color: "#666",
  },
  pendingRole: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 4,
  },
  pendingActions: {
    flexDirection: "row",
    gap: 12,
  },
  approveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#22c55e20",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ef444420",
    alignItems: "center",
    justifyContent: "center",
  },
  denied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  deniedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 8,
  },
  deniedText: {
    fontSize: 14,
    color: "#666",
  },
});
