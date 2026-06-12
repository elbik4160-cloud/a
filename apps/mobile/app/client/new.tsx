import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../hooks/use-auth-store";
import { Input } from "../../../components/input";
import { Button } from "../../../components/button";
import { Card, CardContent } from "../../../components/card";
import { ChevronLeft, User, Phone, FileText, Hash } from "lucide-react-native";

async function createClient(
  data: {
    clientId: string;
    name: string;
    countryCode?: string;
    phone?: string;
    request?: string;
    notes?: string;
    createdBy: string;
    createdByName: string;
  }
) {
  const { error } = await supabase.from("clients").insert(data);
  if (error) throw error;
}

function generateClientId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function NewClientScreen() {
  const user = useAuthStore((s) => s.user)!;
  const queryClient = useQueryClient();

  const [clientId] = useState(generateClientId());
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createClient({
        clientId,
        name,
        countryCode: countryCode || undefined,
        phone: phone || undefined,
        request: request || undefined,
        notes: notes || undefined,
        createdBy: user.id,
        createdByName: user.name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      Alert.alert("Success", "Client created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to create client");
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    createMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Client</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card>
          <CardContent style={{ gap: 16 }}>
            <View style={styles.clientIdRow}>
              <Hash size={18} color="#3b82f6" />
              <Text style={styles.clientIdLabel}>Client ID: </Text>
              <Text style={styles.clientIdValue}>{clientId}</Text>
            </View>

            <Input
              label="Name *"
              placeholder="Client name"
              value={name}
              onChangeText={setName}
              leftIcon={<User size={18} color="#666" />}
            />

            <View style={styles.phoneRow}>
              <Input
                label="Country"
                placeholder="+20"
                value={countryCode}
                onChangeText={setCountryCode}
                keyboardType="phone-pad"
                containerStyle={{ flex: 0.3 }}
              />
              <Input
                label="Phone"
                placeholder="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                containerStyle={{ flex: 0.65 }}
              />
            </View>

            <Input
              label="Request"
              placeholder="What is the client looking for?"
              value={request}
              onChangeText={setRequest}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: "top" }}
              leftIcon={<FileText size={18} color="#666" />}
            />

            <Input
              label="Notes"
              placeholder="Additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: "top" }}
              leftIcon={<FileText size={18} color="#666" />}
            />
          </CardContent>
        </Card>

        <Button
          title="Create Client"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  clientIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  clientIdLabel: {
    fontSize: 14,
    color: "#888",
  },
  clientIdValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3b82f6",
    fontFamily: "monospace",
  },
  phoneRow: {
    flexDirection: "row",
    gap: 12,
  },
});
