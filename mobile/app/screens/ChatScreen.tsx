import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import Avatar from "../../components/Avatar";
import BottomTab from "../../components/BottomTabs";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SOCKET_URL } from "../utills/config";

interface Chat {
  id: string;
  name: string;
  profilePhoto?: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export default function ChatScreen({ navigation }: Props) {
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      const storedId = await AsyncStorage.getItem("userId");
      setToken(storedToken);
      setMyId(storedId);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!myId) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
      socket.emit("register", myId);
    });

    socket.on("receiveMessage", (msg: any) => {
      console.log("Received message:", msg);
      const otherUserId = msg.senderId == myId ? msg.receiverId : msg.senderId;

      setChatList((prev) => {
        const existingIndex = prev.findIndex((chat) => chat.id == otherUserId);

        const updatedChat: Chat = {
          id: otherUserId,
          name:
            (msg.senderId == myId ? msg.receiverName : msg.senderName) ||
            prev[existingIndex]?.name,
          profilePhoto:
            msg.senderProfilePhoto || prev[existingIndex]?.profilePhoto,
          lastMessage: msg.message,
          updatedAt: msg.createdAt,
          unreadCount:
            msg.receiverId == myId
              ? existingIndex >= 0
                ? prev[existingIndex].unreadCount + 1
                : 1
              : 0,
        };

        let newList = [...prev];
        if (existingIndex >= 0) {
          newList[existingIndex] = updatedChat;
        } else {
          newList.push(updatedChat);
        }

        newList.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        return newList;
      });
    });

    // If a user is blocked/reported, remove them from chat list
    socket.on("userBlocked", (data: any) => {
      console.log("socket userBlocked", data);
      const otherId = String(
        data.targetId === Number(myId) ? data.userId : data.targetId
      );
      setChatList((prev) =>
        prev.filter((c) => String(c.id) !== String(otherId))
      );
    });

    socket.on("userReported", (data: any) => {
      console.log("socket userReported", data);
      const otherId = String(
        data.targetId === Number(myId) ? data.reporterId : data.targetId
      );
      setChatList((prev) =>
        prev.filter((c) => String(c.id) !== String(otherId))
      );
    });

    return () => {
      try {
        socket.disconnect();
      } catch (e) {
        console.warn("Error disconnecting socket:", e);
      }
      socketRef.current = null;
    };
  }, [myId]);

  const fetchChats = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${SOCKET_URL}/api/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const chats: Chat[] = res.data.chats.map((c: any) => ({
          id: c.id,
          name: c.name,
          profilePhoto: c.profilePhoto,
          lastMessage: c.lastMessage || "",
          updatedAt: c.updatedAt,
          unreadCount: c.unreadCount || 0,
        }));
        chats.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setChatList(chats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchChats();
    const unsub = navigation.addListener("focus", () => {
      if (token) fetchChats();
    });
    return () => unsub();
  }, [token]);

  // Chat list item (uses reusable Avatar)
  const ChatListItem = ({ item }: { item: Chat }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("ChatBox", {
            userId: item.id,
            name: item.name,
            profilePhoto: item.profilePhoto,
          })
        }
      >
        <View style={styles.chatItemInner}>
          <Avatar
            uri={item.profilePhoto}
            size={58}
            showUnreadDot={item.unreadCount > 0}
          />

          <View style={styles.chatInfo}>
            <View style={styles.chatTop}>
              <Text style={styles.chatName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.chatTime} numberOfLines={1}>
                {new Date(item.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.chatBottom}>
              <Text style={styles.chatLastMessage} numberOfLines={1}>
                {item.lastMessage || "No messages yet"}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // search state to filter chats
  const [searchQuery, setSearchQuery] = useState("");
  const filteredChats = chatList.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.name).toLowerCase().includes(q) ||
      String(c.lastMessage || "")
        .toLowerCase()
        .includes(q)
    );
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#075e54" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#c084fc"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="search-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color="#8b5cf6" />
            <TextInput
              placeholder="Search conversations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#94a3b8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {chatList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Start chatting with service providers
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ChatListItem item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          />
        )}
        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },

  headerGradient: {
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    marginTop: -16,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#1e293b",
    paddingVertical: 0,
  },

  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 3,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  chatItemInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  chatBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  chatLastMessage: {
    fontSize: 13,
    color: "#64748b",
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: "#8b5cf6",
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  // Legacy styles (kept for compatibility)
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
  chatRight: { flexDirection: "row", alignItems: "center" },
  avatarWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef2f7",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  unreadDot: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#25d366",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
