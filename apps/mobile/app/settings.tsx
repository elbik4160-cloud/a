import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../hooks/use-auth-store";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ChevronLeft, User, Shield, LogOut, Moon, Globe, ChevronRight } from "lucide-react-native";
import { Card, CardContent } from "../components/card";
import { t, useLang } from "../hooks/use-lang";

async function updateUserName(userId: string, name: string) {
  const { error } = await supabase
    .from("users")
    .update({ name, updatedAt: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refresh);
  const { lang, isRTL, toggleLang } = useLang();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          logout();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile",
          value: user.name,
          onPress: () => {},
        },
        {
          icon: Shield,
          label: "Role",
          value: user.role,
          onPress: undefined,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Globe,
          label: "Language",
          value: lang === "ar" ? "العربية" : "English",
          onPress: toggleLang,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* User Info Card */}
        <Card style={styles.profileCard}>
          <CardContent style={styles.profileContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name[0]}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={[styles.roleBadge, user.role === "admin" && styles.adminBadge]}>
                <Text style={[styles.roleText, user.role === "admin" && styles.adminText]}>
                  {user.role}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Card>
              <CardContent style={styles.groupContent}>
                {group.items.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.settingRow,
                      index < group.items.length - 1 && styles.settingRowBorder,
                    ]}
                    onPress={item.onPress}
                    disabled={!item.onPress}
                  >
                    <View style={styles.settingLeft}>
                      <item.icon size={20} color="#888" />
                      <Text style={styles.settingLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.settingRight}>
                      <Text style={styles.settingValue}>{item.value}</Text>
                      {item.onPress && <ChevronRight size={18} color="#444" />}
                    </View>
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CRM v1.0.0</Text>
      </View>
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
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 24,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#3b82f620",
    marginTop: 4,
  },
  adminBadge: {
    backgroundColor: "#8b5cf620",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
    textTransform: "capitalize",
  },
  adminText: {
    color: "#8b5cf6",
  },
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
    marginLeft: 4,
  },
  groupContent: {
    padding: 0,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: "#fff",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
    color: "#888",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  version: {
    textAlign: "center",
    color: "#444",
    fontSize: 12,
    marginTop: 40,
  },
});
