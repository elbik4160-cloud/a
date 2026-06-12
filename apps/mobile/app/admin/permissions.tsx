import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../hooks/use-auth-store";
import { router } from "expo-router";
import { ChevronLeft, Shield, Check, X } from "lucide-react-native";
import { Card, CardContent } from "../../../components/card";

interface UserPermission {
  id: number;
  userId: string;
  permissionKey: string;
  granted: boolean;
}

interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: string;
}

const PERMISSIONS = [
  { key: "clients.view", label: "View Clients" },
  { key: "clients.create", label: "Create Clients" },
  { key: "clients.edit", label: "Edit Clients" },
  { key: "clients.delete", label: "Delete Clients" },
  { key: "leads.view", label: "View Leads" },
  { key: "leads.create", label: "Create Leads" },
  { key: "leads.edit", label: "Edit Leads" },
  { key: "leads.delete", label: "Delete Leads" },
  { key: "chat.send", label: "Send Messages" },
  { key: "resale.view", label: "View Resale" },
  { key: "resale.create", label: "Create Resale" },
];

async function getUsersWithPermissions(): Promise<(UserWithPermissions & { permissions: UserPermission[] })[]> {
  const [usersResult, permissionsResult] = await Promise.all([
    supabase.from("users").select("id, name, email, role").eq("status", "approved"),
    supabase.from("user_permissions").select("*"),
  ]);

  const permissionsByUser = new Map<string, UserPermission[]>();
  permissionsResult.data?.forEach((p) => {
    const existing = permissionsByUser.get(p.userId) || [];
    existing.push(p);
    permissionsByUser.set(p.userId, existing);
  });

  return (usersResult.data || []).map((user) => ({
    ...user,
    permissions: permissionsByUser.get(user.id) || [],
  }));
}

async function togglePermission(userId: string, permissionKey: string, granted: boolean) {
  const { error } = await supabase.from("user_permissions").upsert(
    { userId, permissionKey, granted },
    { onConflict: "userId,permissionKey" }
  );
  if (error) throw error;
}

export default function PermissionsScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: usersWithPerms, refetch } = useQuery({
    queryKey: ["usersWithPermissions"],
    queryFn: getUsersWithPermissions,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ userId, permissionKey, granted }: { userId: string; permissionKey: string; granted: boolean }) =>
      togglePermission(userId, permissionKey, granted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usersWithPermissions"] });
    },
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

  const hasPermission = (targetUser: UserWithPermissions & { permissions: UserPermission[] }, key: string) => {
    // Admins have all permissions
    if (targetUser.role === "admin") return true;
    const perm = targetUser.permissions.find((p) => p.permissionKey === key);
    return perm?.granted ?? true; // Default to granted if not set
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={usersWithPerms}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#666" />}
        renderItem={({ item: targetUser }) => (
          <Card style={styles.userCard}>
            <CardContent>
              <View style={styles.userHeader}>
                <View style={[styles.avatar, targetUser.role === "admin" && styles.adminAvatar]}>
                  <Text style={styles.avatarText}>{targetUser.name[0]}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{targetUser.name}</Text>
                  <Text style={styles.userRole}>{targetUser.role}</Text>
                </View>
              </View>

              {targetUser.role !== "admin" && (
                <View style={styles.permissionsGrid}>
                  {PERMISSIONS.map((perm) => {
                    const granted = hasPermission(targetUser, perm.key);
                    return (
                      <TouchableOpacity
                        key={perm.key}
                        style={[styles.permissionChip, granted && styles.permissionChipGranted]}
                        onPress={() => toggleMutation.mutate({ userId: targetUser.id, permissionKey: perm.key, granted })}
                      >
                        <Text style={styles.permissionText}>{perm.label}</Text>
                        {granted ? <Check size={14} color="#22c55e" /> : <X size={14} color="#666" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {targetUser.role === "admin" && (
                <View style={styles.adminNote}>
                  <Shield size={14} color="#8b5cf6" />
                  <Text style={styles.adminNoteText}>Admin has all permissions</Text>
                </View>
              )}
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
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
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
  userInfo: {
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  userRole: {
    fontSize: 12,
    color: "#666",
    textTransform: "capitalize",
  },
  permissionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  permissionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#1a1a1a",
  },
  permissionChipGranted: {
    backgroundColor: "#22c55e20",
  },
  permissionText: {
    fontSize: 11,
    color: "#aaa",
  },
  adminNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#8b5cf620",
    borderRadius: 8,
  },
  adminNoteText: {
    fontSize: 12,
    color: "#8b5cf6",
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
