// app/screens/ChatScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomTab from "../../components/BottomTabs";

const { width } = Dimensions.get("window");

export default function ChatScreen() {
  const router = useRouter();
  const [chatList, setChatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Load token from AsyncStorage
  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    };
    loadToken();
  }, []);

  // Fetch chat list
  const fetchChats = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setChatList(res.data.chats);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll chat list every 3 seconds
  useEffect(() => {
    if (!token) return;

    fetchChats(); // initial fetch
    const interval = setInterval(fetchChats, 5000); // every 3s

    return () => clearInterval(interval); // cleanup
  }, [token]);

  const renderChatItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          router.push({
            pathname: "/screens/ChatBoxScreen",
            params: { userId: item.id, name: item.name },
          })
        }
      >
        <Image
          source={{
            uri:
              item.profilePhoto ||
              "https://randomuser.me/api/portraits/lego/1.jpg",
          }}
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatTop}>
            <Text style={styles.chatName}>{item.name}</Text>
            <View style={styles.chatRight}>
              <Text style={styles.chatTime}>
                {new Date(item.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.chatLastMessage} numberOfLines={1}>
            {item.lastMessage || "No messages yet"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#075e54" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chatList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No chats yet. Start a conversation!
          </Text>
        </View>
      ) : (
        <FlatList
          data={chatList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingVertical: 10 }}
        />
      )}
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ece5dd" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#555" },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 12,
    elevation: 2,
  },
  avatar: { width: 55, height: 55, borderRadius: 28, marginRight: 12 },
  chatInfo: {
    flex: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 0.5,
    paddingBottom: 10,
  },
  chatTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatName: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  chatTime: { fontSize: 12, color: "#94a3b8", marginRight: 8 },
  chatLastMessage: { fontSize: 14, color: "#64748b" },
  unreadBadge: {
    backgroundColor: "#25d366",
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 6,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
});
