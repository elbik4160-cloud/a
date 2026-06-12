import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Phone, Mail, Calendar, User, CreditCard as Edit, ChevronLeft, MessageCircle, CircleCheck as CheckCircle, Circle as XCircle, Clock, MoveVertical as MoreVertical } from "lucide-react-native";
import { Card, CardContent, CardHeader } from "../../components/card";
import { Button } from "../../components/button";

interface Lead {
  id: number;
  name: string;
  phone: string;
  phone2?: string;
  project?: string;
  unitType?: string;
  budget?: string;
  area?: string;
  source: string;
  notes?: string;
  status: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
}

interface Activity {
  id: number;
  leadId: number;
  userName: string;
  type: string;
  notes?: string;
  outcome?: string;
  createdAt: string;
}

async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", parseInt(id))
    .single();
  if (error) throw error;
  return data;
}

async function getLeadActivities(leadId: number): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("leadId", leadId)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateLeadStatus(leadId: number, status: string) {
  const { error } = await supabase
    .from("leads")
    .update({ status, statusChangedAt: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw error;
}

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user)!;
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => getLead(id!),
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ["leadActivities", lead?.id],
    queryFn: () => getLeadActivities(lead!.id),
    enabled: !!lead,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateLeadStatus(lead!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ar-EG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = (newStatus: string) => {
    Alert.alert("Update Status", `Change status to "${newStatus}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => updateStatusMutation.mutate(newStatus) },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Lead not found</Text>
      </View>
    );
  }

  const statuses = ["New", "In Progress", "Follow Up", "Interested", "Not Interested", "Sold"];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <TouchableOpacity>
          <MoreVertical size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.mainCard}>
          <CardContent>
            <Text style={styles.name}>{lead.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) + "20" }]}>
              <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>{lead.status}</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Phone size={16} color="#888" />
                <Text style={styles.infoText}>{lead.phone}</Text>
              </View>
              {lead.phone2 && (
                <View style={styles.infoItem}>
                  <Phone size={16} color="#888" />
                  <Text style={styles.infoText}>{lead.phone2}</Text>
                </View>
              )}
              {lead.project && (
                <View style={styles.infoItem}>
                  <User size={16} color="#888" />
                  <Text style={styles.infoText}>{lead.project}</Text>
                </View>
              )}
              {lead.assignedToName && (
                <View style={styles.infoItem}>
                  <User size={16} color="#888" />
                  <Text style={styles.infoText}>Assigned: {lead.assignedToName}</Text>
                </View>
              )}
              {lead.budget && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Budget: </Text>
                  <Text style={styles.infoText}>{lead.budget}</Text>
                </View>
              )}
              <View style={styles.infoItem}>
                <Calendar size={16} color="#888" />
                <Text style={styles.infoText}>{formatDateTime(lead.createdAt)}</Text>
              </View>
            </View>

            {lead.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{lead.notes}</Text>
              </View>
            )}
          </CardContent>
        </Card>

        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statusButtons}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    lead.status === status && styles.statusButtonActive,
                    { borderColor: getStatusColor(status) },
                  ]}
                  onPress={() => handleStatusChange(status)}
                >
                  {lead.status === status && <CheckCircle size={14} color={getStatusColor(status)} />}
                  <Text style={[styles.statusButtonText, { color: getStatusColor(status) }]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Activity History</Text>
          {activities?.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityType}>{activity.type}</Text>
                <Text style={styles.activityUser}>{activity.userName}</Text>
                {activity.notes && <Text style={styles.activityNotes}>{activity.notes}</Text>}
                <Text style={styles.activityDate}>{formatDateTime(activity.createdAt)}</Text>
              </View>
            </View>
          ))}
          {!activities?.length && (
            <Text style={styles.emptyText}>No activity yet</Text>
          )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
  },
  mainCard: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoGrid: {
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#ccc",
  },
  infoLabel: {
    fontSize: 14,
    color: "#888",
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#262626",
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusButtonActive: {
    backgroundColor: "#1a1a1a",
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  activitiesSection: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
  },
  activityType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  activityUser: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 2,
  },
  activityNotes: {
    fontSize: 13,
    color: "#888",
    marginTop: 8,
  },
  activityDate: {
    fontSize: 11,
    color: "#555",
    marginTop: 6,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
});
