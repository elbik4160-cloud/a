import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useAuthStore } from "../../../hooks/use-auth-store";
import { Input } from "../../../components/input";
import { Button } from "../../../components/button";
import { Card, CardContent } from "../../../components/card";
import { ChevronLeft, User, Phone, Building, DollarSign, MapPin, FileText } from "lucide-react-native";

const sources = [
  "Facebook",
  "WhatsApp",
  "Instagram",
  "Referral",
  "Walk-in",
  "Website",
  "Cold Call",
  "Other",
];

export default function NewLeadScreen() {
  const user = useAuthStore((s) => s.user)!;
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [project, setProject] = useState("");
  const [unitType, setUnitType] = useState("");
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.leads.create({
        name,
        phone,
        phone2: phone2 || undefined,
        project: project || undefined,
        unitType: unitType || undefined,
        budget: budget || undefined,
        area: area || undefined,
        source: source || "Other",
        notes: notes || undefined,
        createdById: user.id,
        createdByName: user.name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      Alert.alert("Success", "Lead created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to create lead");
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Phone is required");
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
        <Text style={styles.headerTitle}>New Lead</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card>
          <CardContent style={{ gap: 16 }}>
            <Input
              label="Name *"
              placeholder="Lead name"
              value={name}
              onChangeText={setName}
              leftIcon={<User size={18} color="#666" />}
            />

            <Input
              label="Phone *"
              placeholder="Primary phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color="#666" />}
            />

            <Input
              label="Secondary Phone"
              placeholder="Secondary phone (optional)"
              value={phone2}
              onChangeText={setPhone2}
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color="#666" />}
            />

            <Input
              label="Project"
              placeholder="Project name"
              value={project}
              onChangeText={setProject}
              leftIcon={<Building size={18} color="#666" />}
            />

            <Input
              label="Unit Type"
              placeholder="e.g., Apartment, Villa"
              value={unitType}
              onChangeText={setUnitType}
            />

            <Input
              label="Budget"
              placeholder="Budget range"
              value={budget}
              onChangeText={setBudget}
              leftIcon={<DollarSign size={18} color="#666" />}
            />

            <Input
              label="Area"
              placeholder="Preferred area"
              value={area}
              onChangeText={setArea}
              leftIcon={<MapPin size={18} color="#666" />}
            />

            <View style={styles.sourceSection}>
              <Text style={styles.sourceLabel}>Source</Text>
              <View style={styles.sourceGrid}>
                {sources.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sourceChip, source === s && styles.sourceChipActive]}
                    onPress={() => setSource(s)}
                  >
                    <Text style={[styles.sourceChipText, source === s && styles.sourceChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Notes"
              placeholder="Additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: "top" }}
              leftIcon={<FileText size={18} color="#666" />}
            />
          </CardContent>
        </Card>

        <Button
          title="Create Lead"
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
  sourceSection: {
    gap: 8,
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888",
  },
  sourceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  sourceChipActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  sourceChipText: {
    color: "#888",
    fontSize: 13,
  },
  sourceChipTextActive: {
    color: "#fff",
  },
});
