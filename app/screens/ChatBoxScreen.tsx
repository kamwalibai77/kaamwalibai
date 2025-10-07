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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import io from "socket.io-client";
import { SOCKET_URL } from "../utills/config";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

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
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const params = route.params;
  const userId = params?.userId;
  const name = params?.name;
  const profilePhoto = params?.profilePhoto;

  // 🚨 Restricted words
  const restrictedWords: string[] = [
    "sex",
    "nude",
    "naked",
    "rape",
    "porn",
    "xxx",
    "boobs",
    "fuck",
    "ass",
    "assault",
    "murder",
    "kill",
    "harass",
    "molest",
    "slut",
    "bitch",
    "dick",
    "cock",
    "pussy",
    "dildo",
    "condom",
    "blowjob",
    "handjob",
    "anal",
    "incest",
    "orgy",
    "prostitute",
    "whore",
    "chutiya",
    "asshole",
    "chut",
    "chutiye",
    "chudai",
    "lund",
    "gaand",
    "randi",
    "bhosdi",
    "bhosdike",
    "madarchod",
    "behenchod",
    "teri maa",
    "teri bahan",
    "gandu",
    "harami",
    "kamina",
    "suar",
    "रंडी",
    "बलात्कार",
    "रेप",
    "सेक्स",
    "नंगा",
    "चुदाई",
    "गांडू",
    "मादरचोद",
    "भोसड़ीके",
    "चूत",
    "लंड",
    "रंडी",
    "कमिना",
    "chod",
    "chodna",
    "lavda",
    "lavde",
    "gand",
    "bhadva",
    "randi",
    "sali",
    "maushi",
    "aai cha lavda",
    "najayaz",
    "haramkhor",
    "चोद",
    "लवडा",
    "गांड",
    "भडवा",
    "साली",
    "हरामखोर",
    "आईचा लौडा",
    "तुझ्या मायला",
    "तुझ्या बहिणीला",
  ];

  const containsRestrictedWords = (text: string) => {
    const lowerText = text.toLowerCase();
    return restrictedWords.some((word) => lowerText.includes(word));
  };

  useEffect(() => {
    if (!userId) {
      try {
        navigation.dispatch(StackActions.replace("Chat"));
      } catch {
        navigation.goBack();
      }
    }
  }, [userId, navigation]);

  useEffect(() => {
    const fetchUser = async () => {
      const storedId = await AsyncStorage.getItem("userId");
      const storedToken = await AsyncStorage.getItem("token");
      setMyId(storedId);
      setToken(storedToken);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!myId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      socket.emit("register", myId);
    });

    socket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [myId]);

  useEffect(() => {
    if (!myId || !token || !userId) return;

    const fetchMessages = async () => {
      try {
        await axios.put(
          `${SOCKET_URL}/api/chat/read/${userId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const res = await axios.get(`${SOCKET_URL}/api/chat/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setMessages(res.data.messages);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [myId, userId, token]);

  const sendMessage = async () => {
    if (!input.trim() || !token || !myId) return;

    if (containsRestrictedWords(input)) {
      Alert.alert("⚠️ Warning", "Your message contains inappropriate words.");
      return;
    }

    if (editingMessage) {
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
            <Text style={{ marginLeft: wp(1.5) }}>
              {item.liked ? "❤️" : "🤍"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={hp(1)}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={hp(3)} color="white" />
          </TouchableOpacity>
          <Image
            source={{
              uri:
                profilePhoto ||
                "https://randomuser.me/api/portraits/lego/1.jpg",
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

        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom, hp(1.5)) },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons
              name={editingMessage ? "pencil-outline" : "send-outline"}
              size={hp(3)}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ece5dd" },
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === "ios" ? hp(5) : hp(2.5),
    paddingBottom: hp(1.8),
    backgroundColor: "#075e54",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(3),
    borderBottomWidth: 0.3,
    borderBottomColor: "#ccc",
    elevation: 4,
  },
  userImage: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    marginLeft: wp(3),
    marginRight: wp(2),
  },
  headerText: { color: "white", fontSize: hp(2.1), fontWeight: "600" },
  chatContainer: { paddingHorizontal: wp(3), paddingVertical: hp(1) },
  messageWrapper: { marginVertical: hp(0.5) },
  alignRight: { alignSelf: "flex-end" },
  alignLeft: { alignSelf: "flex-start" },
  messageBubble: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    maxWidth: "80%",
    elevation: 2,
  },
  myMessage: { backgroundColor: "#b7ffa5ff", borderTopRightRadius: 5 },
  theirMessage: { backgroundColor: "#fff", borderTopLeftRadius: 5 },
  messageText: { fontSize: hp(1.9), color: "#000" },
  timeWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: hp(0.4),
  },
  timeText: { fontSize: hp(1.3), color: "#555" },
  readText: { fontSize: hp(1.3), color: "#007aff" },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "#ddd",
    paddingHorizontal: wp(3),
    paddingTop: hp(1),
    elevation: 6,
  },
  input: {
    flex: 1,
    borderRadius: wp(6),
    backgroundColor: "#fff",
    paddingHorizontal: wp(4),
    fontSize: hp(2),
    height: hp(6),
    marginRight: wp(2),
  },
  sendButton: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: "#128c7e",
    justifyContent: "center",
    alignItems: "center",
  },
});
