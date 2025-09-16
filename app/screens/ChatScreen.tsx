// app/screens/ChatScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import BottomTab from "../../components/BottomTabs";

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: "1", text: "Hello! How can I help you today?", type: "received" },
    {
      id: "2",
      text: "Hi! I need a cleaning service at my home.",
      type: "sent",
    },
    { id: "3", text: "Sure! When do you want the service?", type: "received" },
  ]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const handleSend = () => {
    if (input.trim() === "") return;
    const newMsg = { id: Date.now().toString(), text: input, type: "sent" };
    setMessages([...messages, newMsg]);
    setInput("");
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({
    item,
  }: {
    item: { id: string; text: string; type: string };
  }) => {
    const isSent = item.type === "sent";
    return (
      <View
        style={[
          styles.messageContainer,
          isSent ? styles.messageSent : styles.messageReceived,
        ]}
      >
        {!isSent && (
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
            style={styles.avatar}
          />
        )}
        <LinearGradient
          colors={isSent ? ["#6366f1", "#4f46e5"] : ["#e0e7ff", "#c7d2fe"]}
          style={[styles.bubble, isSent ? { alignSelf: "flex-end" } : {}]}
        >
          <Text style={[styles.messageText, isSent && { color: "#fff" }]}>
            {item.text}
          </Text>
        </LinearGradient>
        {isSent && (
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/47.jpg" }}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <LinearGradient colors={["#6366f1", "#4f46e5"]} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/screens/HomeScreen")}
          >
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Anita Sharma</Text>
        </LinearGradient>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
        />

        {/* Input Box */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { width: width * 0.75 }]}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* Bottom Tabs (same as before) */}
      <BottomTab />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
  messagesContainer: { padding: 10 },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 6,
  },
  messageSent: { justifyContent: "flex-end" },
  messageReceived: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  messageText: { fontSize: 14, color: "#1e293b" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#334155",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});
