import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Link } from "expo-router";
import { Plus, Phone, Search, ChevronRight, Lock } from "lucide-react-native";
import { Card, CardContent } from "../../components/card";

interface Client {
  id: number;
  clientId: string;
  name: string;
  phone?: string;
  request?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

async function getClients(userId: string, role: string) {
  const query = supabase
    .from("clients")
    .select("id, clientId, name, phone, request, createdBy, createdByName, createdAt")
    .order("createdAt", { ascending: false });

  if (role !== "admin") {
    query.eq("createdBy", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Client[];
}

async function getLockedClients() {
  const { data, error } = await supabase
    .from("client_locks")
    .select("clientId");
  if (error) throw error;
  return new Set(data?.map((l) => l.clientId) || []);
}

export default function ClientsScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients", user.id, user.role],
    queryFn: () => getClients(user.id, user.role),
  });

  const { data: lockedIds } = useQuery({
    queryKey: ["lockedClients"],
    queryFn: getLockedClients,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredClients = clients?.filter((client) => {
    return !search ||
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.clientId.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <Link href="/client/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.clientId}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#666" />}
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <Search size={18} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              placeholderTextColor="#666"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        }
        renderItem={({ item }) => {
          const isLocked = lockedIds?.has(item.clientId);
          return (
            <Link href={`/client/${item.clientId}`} asChild>
              <TouchableOpacity>
                <Card style={[styles.clientCard, isLocked && styles.clientCardLocked]}>
                  <CardContent style={styles.clientContent}>
                    <View style={styles.clientInfo}>
                      <View style={styles.clientNameRow}>
                        <Text style={styles.clientName}>{item.name}</Text>
                        {isLocked && <Lock size={14} color="#f59e0b" />}
                      </View>
                      <Text style={styles.clientId}>#{item.clientId}</Text>
                      <View style={styles.clientMeta}>
                        <Phone size={12} color="#444" />
                        <Text style={styles.clientPhone}>{item.phone || "No phone"}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#444" />
                  </CardContent>
                </Card>
              </TouchableOpacity>
            </Link>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No clients found</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#3b82f6",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  clientCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  clientCardLocked: {
    borderColor: "#f59e0b40",
    backgroundColor: "#f59e0b08",
  },
  clientContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  clientId: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
  },
  clientMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  clientPhone: {
    fontSize: 13,
    color: "#555",
  },
  empty: {
    padding: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});
