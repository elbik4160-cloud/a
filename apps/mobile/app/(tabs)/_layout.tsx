import { Tabs } from "expo-router";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Hop as Home, Users, MessageSquare, User, ChartBar as BarChart3 } from "lucide-react-native";
import { useAuthStore } from "../../hooks/use-auth-store";
import { Redirect } from "expo-router";

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  if (!user) return <Redirect href="/(auth)/sign-in" />;
  if (user.status === "pending") return <Redirect href="/pending" />;

  const isAdmin = user.role === "admin";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#141414",
            borderTopColor: "#262626",
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#666",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="leads"
          options={{
            title: "Leads",
            tabBarIcon: ({ color }) => <Users size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: "Clients",
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />,
          }}
        />
        {isAdmin && (
          <Tabs.Screen
            name="admin"
            options={{
              title: "Admin",
              tabBarIcon: ({ color }) => <BarChart3 size={22} color={color} />,
            }}
          />
        )}
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
