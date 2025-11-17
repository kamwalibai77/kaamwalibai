import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
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
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.chatItemInner}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("ChatBox", {
              userId: item.id,
              name: item.name,
              profilePhoto: item.profilePhoto,
            })
          }
        >
          <Avatar
            uri={item.profilePhoto}
            size={55}
            showUnreadDot={item.unreadCount > 0}
          />

          <View style={styles.chatInfo}>
            <View style={styles.chatTop}>
              <Text style={styles.chatName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.chatRight}>
                <Text style={styles.chatTime} numberOfLines={1}>
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
      </View>
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
      {/* ✅ Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          {/* <Ionicons name="arrow-back" size={28} color="#075e54" /> */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search chats"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#9ca3af"
          />
        </View>
        {chatList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No chats yet. Start a conversation!
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ChatListItem item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          />
        )}
        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#075e54" },

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
  chatInfo: { flex: 1 },
  chatTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatRight: { flexDirection: "row", alignItems: "center" },
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
  /* new styles */
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
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  searchInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    color: "#111827",
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    padding: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  chatItemInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
});
