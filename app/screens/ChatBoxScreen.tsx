// app/screens/ChatBoxScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useRoute } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
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
} from "react-native";
import { RootStackParamList } from "/../navigators/AppNavigator";

type ChatBoxRouteProp = RouteProp<RootStackParamList, "ChatBox">;

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

export default function ChatBoxScreen() {
  const { params } = useRoute<ChatBoxRouteProp>();
  const { userId, name, profilePhoto } = params; // profile photo passed from ChatScreen

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

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

  // Fetch chat history and mark messages as read
  useEffect(() => {
    if (!myId || !token) return;

    const fetchMessages = async () => {
      try {
        await axios.put(
          `http://localhost:5000/api/chat/read/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const res = await axios.get(
          `http://localhost:5000/api/chat/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // poll every 3s
    return () => clearInterval(interval);
  }, [myId, userId, token]);

  const sendMessage = async () => {
    if (!input.trim() || !token || !myId) return;

    try {
      const res = await axios.post(
        "http://localhost:5000/api/chat/send",
        {
          senderId: myId,
          receiverId: userId,
          message: input,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setInput("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = String(item.senderId) === String(myId);

    return (
      <View
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
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header with profile image and name */}
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
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
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
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  myMessage: { backgroundColor: "#25d366", borderTopRightRadius: 5 },
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
    elevation: 3,
  },
  sendText: { color: "#fff", fontWeight: "bold" },
});
