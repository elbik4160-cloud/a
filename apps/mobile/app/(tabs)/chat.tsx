import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../hooks/use-auth-store";
import { useRealtime } from "../../hooks/use-realtime";
import { Send, CircleUser as User } from "lucide-react-native";

interface Message {
  id: number;
  userId: string;
  email: string;
  name: string;
  role: string;
  messageText: string;
  createdAt: string;
  isDeleted: boolean;
}

export default function ChatScreen() {
  const user = useAuthStore((s) => s.user)!;
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();

  const isAdmin = user.role === "admin";

  const { data: messages, isLoading, refetch } = useQuery<Message[]>({
    queryKey: ["chatMessages"],
    queryFn: () => api.chat.messages(),
  });

  // Realtime subscription
  useRealtime("chat:global", (data: any) => {
    if (data.event === "new_message" || data.event === "message_deleted") {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    }
  });

  const sendMutation = useMutation({
    mutationFn: () => api.chat.send(message),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to send message");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => api.chat.delete(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message);
    },
  });

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate();
  };

  const handleDelete = (messageId: number) => {
    if (!isAdmin) return;
    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(messageId) },
    ]);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const displayMessages = messages?.filter((m) => !m.isDeleted) || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Team Chat</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayMessages}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item, index }) => {
          const isMe = item.userId === user.id;
          const showDate =
            index === 0 || formatDate(item.createdAt) !== formatDate(displayMessages[index - 1].createdAt);

          const MsgIcon = item.role === "admin" ? User : User;

          return (
            <View key={item.id}>
              {showDate && (
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText}>{formatDate(item.createdAt)}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.messageBubble, isMe && styles.myMessage]}
                onLongPress={() => isAdmin && !isMe && handleDelete(item.id)}
              >
                {!isMe && (
                  <View style={styles.senderRow}>
                    <View style={[styles.avatar, item.role === "admin" && styles.adminAvatar]}>
                      <Text style={styles.avatarText}>{item.name[0]}</Text>
                    </View>
                    <Text style={styles.senderName}>{item.name}</Text>
                    {item.role === "admin" && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                )}
                <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                  {item.messageText}
                </Text>
                <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={20} color={message.trim() ? "#fff" : "#666"} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateHeader: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateHeaderText: {
    color: "#666",
    fontSize: 12,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageBubble: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    maxWidth: "85%",
    alignSelf: "flex-start",
  },
  myMessage: {
    backgroundColor: "#3b82f6",
    alignSelf: "flex-end",
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  adminAvatar: {
    backgroundColor: "#8b5cf6",
  },
  avatarText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  senderName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#aaa",
  },
  adminBadge: {
    backgroundColor: "#8b5cf630",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: "#8b5cf6",
    fontSize: 10,
    fontWeight: "600",
  },
  messageText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  timeText: {
    fontSize: 10,
    color: "#555",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    backgroundColor: "#0a0a0a",
  },
  input: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#333",
  },
  sendButton: {
    backgroundColor: "#3b82f6",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#1a1a1a",
  },
});
