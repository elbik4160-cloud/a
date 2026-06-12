import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../hooks/use-auth-store";
import { router } from "expo-router";
import { ChevronLeft, Shield, User, ChevronRight } from "lucide-react-native";
import { Card, CardContent } from "../../../components/card";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

async function getUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, createdAt")
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateUserRole(userId: string, role: string) {
  const { error } = await supabase
    .from("users")
    .update({ role, updatedAt: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export default function UsersAdminScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRoleChange = (targetUser: AppUser) => {
    const newRole = targetUser.role === "admin" ? "sales" : "admin";
    Alert.alert(
      "Change Role",
      `Change ${targetUser.name}'s role to ${newRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => updateRoleMutation.mutate({ userId: targetUser.id, role: newRole }),
        },
      ]
    );
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

  const getRoleColor = (role: string) => (role === "admin" ? "#8b5cf6" : "#3b82f6");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#666" />}
        renderItem={({ item }) => (
          <Card style={styles.userCard}>
            <CardContent style={styles.userContent}>
              <View style={styles.userInfo}>
                <View style={[styles.avatar, item.role === "admin" && styles.adminAvatar]}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + "20" }]}
                onPress={() => handleRoleChange(item)}
              >
                <Shield size={14} color={getRoleColor(item.role)} />
                <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>{item.role}</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No users found</Text>
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
  userCard: {},
  userContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  adminAvatar: {
    backgroundColor: "#8b5cf6",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  userEmail: {
    fontSize: 13,
    color: "#666",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  empty: {
    padding: 60,
    alignItems: "center",
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
