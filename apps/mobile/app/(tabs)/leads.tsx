import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Link } from "expo-router";
import { Plus, Phone, Search, ChevronRight } from "lucide-react-native";
import { Card, CardContent } from "../../components/card";

interface Lead {
  id: number;
  name: string;
  phone: string;
  project?: string;
  status: string;
  assignedToName?: string;
  createdAt: string;
}

async function getLeads(userId: string, role: string) {
  const query = supabase
    .from("leads")
    .select("id, name, phone, project, status, assignedToName, createdAt")
    .order("createdAt", { ascending: false });

  if (role !== "admin") {
    query.eq("assignedToId", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Lead[];
}

export default function LeadsScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ["leads", user.id, user.role],
    queryFn: () => getLeads(user.id, user.role),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      New: "#8b5cf6",
      "In Progress": "#3b82f6",
      "Follow Up": "#f59e0b",
      Interested: "#22c55e",
      "Not Interested": "#ef4444",
      Sold: "#10b981",
    };
    return colors[status] || "#666";
  };

  const statuses = ["New", "In Progress", "Follow Up", "Interested", "Not Interested", "Sold"];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>
        <Link href="/lead/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterBar}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
            onPress={() => setStatusFilter(statusFilter === status ? null : status)}
          >
            <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#666" />}
        renderItem={({ item }) => (
          <Link href={`/lead/${item.id}`} asChild>
            <TouchableOpacity>
              <Card style={styles.leadCard}>
                <CardContent style={styles.leadContent}>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadName}>{item.name}</Text>
                    <View style={styles.leadMeta}>
                      <Phone size={14} color="#555" />
                      <Text style={styles.leadPhone}>{item.phone}</Text>
                      {item.project && <Text style={styles.leadProject}> | {item.project}</Text>}
                    </View>
                    {item.assignedToName && (
                      <Text style={styles.leadAssigned}>{item.assignedToName}</Text>
                    )}
                  </View>
                  <View style={styles.leadRight}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                    <ChevronRight size={18} color="#444" />
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No leads found</Text>
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
  searchBar: {
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
  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  filterChipActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterChipText: {
    color: "#888",
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  leadCard: {},
  leadContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leadInfo: {
    flex: 1,
    gap: 4,
  },
  leadName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  leadMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  leadPhone: {
    fontSize: 13,
    color: "#666",
  },
  leadProject: {
    fontSize: 13,
    color: "#555",
  },
  leadAssigned: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 2,
  },
  leadRight: {
    alignItems: "flex-end",
    gap: 8,
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
  empty: {
    padding: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});
