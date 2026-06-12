import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Phone, Mail, Calendar, User, ChevronLeft, MoveVertical as MoreVertical, Lock, Clock as Unlock, MessageCircle, FileText } from "lucide-react-native";
import { Card, CardContent } from "../../components/card";
import { Button } from "../../components/button";

interface Client {
  id: number;
  clientId: string;
  name: string;
  countryCode?: string;
  phone?: string;
  request?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

async function getClient(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("clientId", clientId)
    .single();
  if (error) throw error;
  return data;
}

async function checkLock(clientId: string) {
  const { data, error } = await supabase
    .from("client_locks")
    .select("*")
    .eq("clientId", clientId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

async function lockClient(clientId: string, userId: string, email: string, name: string) {
  const { error } = await supabase.from("client_locks").insert({
    clientId,
    salesUserId: userId,
    salesEmail: email,
    salesName: name,
  });
  if (error) throw error;
}

async function unlockClient(clientId: string) {
  const { error } = await supabase.from("client_locks").delete().eq("clientId", clientId);
  if (error) throw error;
}

async function addFeedback(
  clientId: string,
  userId: string,
  name: string,
  email: string,
  clientStatus: string,
  notes?: string
) {
  const { error } = await supabase.from("feedback").insert({
    clientId,
    salesUserId: userId,
    salesName: name,
    salesEmail: email,
    clientStatus,
    notes,
  });
  if (error) throw error;
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user)!;
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => getClient(id!),
    enabled: !!id,
  });

  const { data: lock } = useQuery({
    queryKey: ["clientLock", id],
    queryFn: () => checkLock(id!),
    enabled: !!id,
  });

  const lockMutation = useMutation({
    mutationFn: () => lockClient(id!, user.id, user.email, user.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientLock", id] });
      queryClient.invalidateQueries({ queryKey: ["lockedClients"] });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => unlockClient(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientLock", id] });
      queryClient.invalidateQueries({ queryKey: ["lockedClients"] });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: (status: string) =>
      addFeedback(id!, user.id, user.name, user.email, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", id] });
      Alert.alert("Success", "Feedback submitted successfully");
    },
  });

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Client not found</Text>
      </View>
    );
  }

  const isLocked = !!lock;
  const isLockedByMe = lock?.salesUserId === user.id;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Details</Text>
        <TouchableOpacity>
          <MoreVertical size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.mainCard}>
          <CardContent>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{client.name}</Text>
              {isLocked && <Lock size={18} color={isLockedByMe ? "#f59e0b" : "#ef4444"} />}
            </View>
            <Text style={styles.clientId}>#{client.clientId}</Text>

            <View style={styles.infoGrid}>
              {client.phone && (
                <View style={styles.infoItem}>
                  <Phone size={16} color="#888" />
                  <Text style={styles.infoText}>{client.countryCode} {client.phone}</Text>
                </View>
              )}
              {client.createdByName && (
                <View style={styles.infoItem}>
                  <User size={16} color="#888" />
                  <Text style={styles.infoText}>Added by: {client.createdByName}</Text>
                </View>
              )}
              <View style={styles.infoItem}>
                <Calendar size={16} color="#888" />
                <Text style={styles.infoText}>{formatDateTime(client.createdAt)}</Text>
              </View>
            </View>

            {client.request && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Request</Text>
                <Text style={styles.sectionText}>{client.request}</Text>
              </View>
            )}

            {client.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Notes</Text>
                <Text style={styles.sectionText}>{client.notes}</Text>
              </View>
            )}
          </CardContent>
        </Card>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {isLockedByMe ? (
            <Button
              title="Unlock"
              onPress={() => unlockMutation.mutate()}
              variant="outline"
              icon={<Unlock size={18} color="#3b82f6" />}
              loading={unlockMutation.isPending}
            />
          ) : !isLocked ? (
            <Button
              title="Lock / Start Working"
              onPress={() => lockMutation.mutate()}
              variant="primary"
              icon={<Lock size={18} color="#fff" />}
              loading={lockMutation.isPending}
            />
          ) : (
            <Card style={styles.lockedInfo}>
              <CardContent>
                <Text style={styles.lockedText}>
                  Locked by {lock.salesName}
                </Text>
              </CardContent>
            </Card>
          )}
        </View>

        {isLockedByMe && (
          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>Add Feedback</Text>
            <View style={styles.statusButtons}>
              {["Interested", "Not Interested", "Follow Up", "Sold"].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.feedbackButton}
                  onPress={() =>
                    Alert.alert(
                      "Confirm",
                      `Mark as "${status}"?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Confirm", onPress: () => feedbackMutation.mutate(status) },
                      ]
                    )
                  }
                >
                  <Text style={styles.feedbackButtonText}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  clientId: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
    marginTop: 4,
    marginBottom: 20,
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
  section: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#262626",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  lockedInfo: {
    backgroundColor: "#f59e0b10",
    borderColor: "#f59e0b40",
  },
  lockedText: {
    color: "#f59e0b",
    fontSize: 14,
  },
  feedbackSection: {
    gap: 12,
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  feedbackButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  feedbackButtonText: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "500",
  },
});
