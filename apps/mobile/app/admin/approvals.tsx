import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../hooks/use-auth-store";
import { router } from "expo-router";
import { ChevronLeft, UserCheck, UserX, Clock } from "lucide-react-native";
import { Card, CardContent } from "../../../components/card";
import { Button } from "../../../components/button";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  requestedRole: string;
  createdAt: string;
}

async function getPendingUsers(): Promise<PendingUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, requestedRole, createdAt")
    .eq("status", "pending")
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function approveUser(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ status: "approved", updatedAt: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

async function rejectUser(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ status: "rejected", updatedAt: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export default function ApprovalsScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading, refetch } = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: getPendingUsers,
  });

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleApprove = (pendingUser: PendingUser) => {
    Alert.alert("Approve User", `Approve ${pendingUser.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => approveMutation.mutate(pendingUser.id) },
    ]);
  };

  const handleReject = (pendingUser: PendingUser) => {
    Alert.alert("Reject User", `Reject ${pendingUser.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => rejectMutation.mutate(pendingUser.id) },
    ]);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={pendingUsers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#666" />}
        renderItem={({ item }) => (
          <Card style={styles.pendingCard}>
            <CardContent style={styles.pendingContent}>
              <View style={styles.pendingInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View style={styles.pendingDetails}>
                  <Text style={styles.pendingName}>{item.name}</Text>
                  <Text style={styles.pendingEmail}>{item.email}</Text>
                  <View style={styles.roleRow}>
                    <Text style={styles.roleLabel}>Requested: </Text>
                    <Text style={styles.roleValue}>{item.requestedRole}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.pendingActions}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprove(item)}
                >
                  <UserCheck size={20} color="#22c55e" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleReject(item)}
                >
                  <UserX size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Clock size={48} color="#333" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No pending approvals</Text>
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
    gap: 12,
  },
  pendingCard: {
    borderColor: "#f59e0b40",
  },
  pendingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  pendingDetails: {
    gap: 2,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  pendingEmail: {
    fontSize: 13,
    color: "#666",
  },
  roleRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  roleLabel: {
    fontSize: 12,
    color: "#555",
  },
  roleValue: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  pendingActions: {
    flexDirection: "row",
    gap: 12,
  },
  approveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#22c55e20",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ef444420",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    padding: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
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
