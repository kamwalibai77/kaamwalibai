import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RouteProp,
  useRoute,
  useNavigation,
  NavigationProp,
  StackActions,
} from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import io from "socket.io-client";
import { SOCKET_URL } from "../utills/config";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";

type ChatBoxRouteProp = RouteProp<RootStackParamList, "ChatBox">;

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  read?: boolean;
  liked?: boolean;
}

export default function ChatBoxScreen() {
  const route = useRoute<ChatBoxRouteProp>();
  const navigation =
    useNavigation<NavigationProp<Record<string, object | undefined>>>();

  // Hooks must be declared unconditionally at the top
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  // Extract params early (may be undefined)
  const params = route.params;
  const userId = params?.userId;
  const name = params?.name;
  const profilePhoto = params?.profilePhoto;

  // If the screen was opened without params, redirect back to the chat list to avoid a crash
  useEffect(() => {
    if (!userId) {
      try {
        navigation.dispatch(StackActions.replace("Chat"));
      } catch (e) {
        try {
          navigation.goBack();
        } catch (e) {
          console.warn(
            "Unable to navigate away from ChatBox when params are missing."
          );
        }
      }
    }
  }, [userId, navigation]);

  // Load my user id + token from storage
  useEffect(() => {
    const fetchUser = async () => {
      const storedId = await AsyncStorage.getItem("userId");
      const storedToken = await AsyncStorage.getItem("token");
      setMyId(storedId);
      setToken(storedToken);
    };
    fetchUser();
  }, []);

  // Setup socket connection
  useEffect(() => {
    if (!myId) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server:", socket.id);
      socket.emit("register", myId);
    });

    socket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
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

  // Fetch chat history
  useEffect(() => {
    if (!myId || !token || !userId) return;

    const fetchMessages = async () => {
      try {
        await axios.put(
          `${SOCKET_URL}/api/chat/read/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const res = await axios.get(`${SOCKET_URL}/api/chat/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [myId, userId, token]);

  const sendMessage = async () => {
    if (!input.trim() || !token || !myId) return;

    if (editingMessage) {
      // Edit existing message
      try {
        const res = await axios.put(
          `${SOCKET_URL}/api/chat/${editingMessage.id}`,
          { message: input.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setMessages((prev) =>
            prev.map((m) => (m.id === editingMessage.id ? res.data.message : m))
          );
          setEditingMessage(null);
          setInput("");
        }
      } catch (err) {
        console.error("Error editing message:", err);
      }
    } else {
      // Send new message
      const newMessage: Message = {
        id: Math.random().toString(),
        senderId: myId,
        receiverId: userId,
        message: input.trim(),
        createdAt: new Date().toISOString(),
        read: false,
        liked: false,
      };

      socketRef.current?.emit("sendMessage", newMessage);
      setMessages((prev) => [...prev, newMessage]);
      setInput("");

      try {
        await axios.post(`${SOCKET_URL}/api/chat/send`, newMessage, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Error saving message:", err);
      }
    }
  };

  const likeMessage = (msg: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, liked: !m.liked } : m))
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = String(item.senderId) === String(myId);

    return (
      <TouchableOpacity
        onLongPress={() => {
          if (isMe) {
            setEditingMessage(item);
            setInput(item.message);
          }
        }}
        onPress={() => likeMessage(item)}
        style={[
          styles.messageWrapper,
          isMe ? styles.alignRight : styles.alignLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myMessage : styles.theirMessage,
          ]}
        >
          <Text style={styles.messageText}>{item.message}</Text>
          <View style={styles.timeWrapper}>
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {isMe && item.read && <Text style={styles.readText}>✓✓</Text>}
            <Text style={{ marginLeft: 4 }}>{item.liked ? "❤️" : "🤍"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Image
          source={{
            uri:
              profilePhoto || "https://randomuser.me/api/portraits/lego/1.jpg",
          }}
          style={styles.userImage}
        />
        <Text style={styles.headerText}>{name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons
            name={editingMessage ? "pencil-outline" : "send-outline"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ece5dd" },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: "#075e54",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 4,
  },
  userImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  headerText: { color: "white", fontSize: 18, fontWeight: "bold" },
  chatContainer: { paddingHorizontal: 10, paddingVertical: 5 },
  messageWrapper: { marginVertical: 4 },
  alignRight: { alignSelf: "flex-end" },
  alignLeft: { alignSelf: "flex-start" },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  myMessage: { backgroundColor: "#b7ffa5ff", borderTopRightRadius: 5 },
  theirMessage: { backgroundColor: "#fff", borderTopLeftRadius: 5 },
  messageText: { fontSize: 16, color: "#000" },
  timeWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  timeText: { fontSize: 10, color: "#555", marginRight: 4 },
  readText: { fontSize: 10, color: "#007aff" },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    fontSize: 16,
    height: 45,
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#128c7e",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
  },
});
