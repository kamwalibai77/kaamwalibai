import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationProp,
  RouteProp,
  StackActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import io from "socket.io-client";
import Snackbar from "../../components/Snackbar";
import { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";
import { SOCKET_URL } from "../utills/config";

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
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
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

    // If server notifies that a message was blocked, show user feedback
    socket.on("messageBlocked", (data: any) => {
      console.warn("messageBlocked", data);
      // remove the locally optimistic message if present
      const msgId = data?.data?.id;
      if (msgId) {
        setMessages((prev) =>
          prev.filter((m) => String(m.id) !== String(msgId))
        );
      }
      Alert.alert(
        "Message blocked",
        data?.reason || "Your message was blocked"
      );
    });

    // If either user was blocked/reported, close this chat and inform the user
    socket.on("userBlocked", (data: any) => {
      console.log("socket userBlocked in ChatBox", data);
      const otherId = String(userId);
      if (
        String(data.userId) === otherId ||
        String(data.targetId) === otherId
      ) {
        Alert.alert(
          "Chat removed",
          "This conversation is no longer available.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    });

    socket.on("userReported", (data: any) => {
      console.log("socket userReported in ChatBox", data);
      const otherId = String(userId);
      if (
        String(data.reporterId) === otherId ||
        String(data.targetId) === otherId
      ) {
        Alert.alert(
          "Chat removed",
          "This conversation is no longer available.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [myId]);

  // Fetch and show the tapped user's profile in a modal
  const openUserProfile = async () => {
    if (!userId) return;
    setProfileLoading(true);
    setProfileUser(null);
    setProfileModalVisible(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await api.get(`/users/${userId}`, { headers });
      if (res && res.data) {
        setProfileUser(res.data.user || res.data);
      }
    } catch (e) {
      console.warn("Failed to fetch profile", e);
    } finally {
      setProfileLoading(false);
    }
  };

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

  // Add header right menu (three dots) for rating/block/report
  useEffect(() => {
    try {
      (navigation as any).setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              setActionModalVisible(true);
            }}
            style={{ paddingHorizontal: wp(3) }}
          >
            <Ionicons name="ellipsis-vertical" size={hp(3)} color="#fff" />
          </TouchableOpacity>
        ),
      });
    } catch (err) {
      // ignore setOptions errors on older navigators
    }
  }, [navigation, token, userId]);

  // Modal actions implementations
  const handleBlockUser = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const storedToken = token || (await AsyncStorage.getItem("token"));
      const targetIdNum = userId ? parseInt(String(userId), 10) : null;
      if (!targetIdNum) throw new Error("Missing targetId");

      const res = await api.post(
        "/rating/block",
        { targetId: targetIdNum },
        storedToken
          ? { headers: { Authorization: `Bearer ${storedToken}` } }
          : undefined
      );
      console.debug("Block response:", res?.data);
      const ok = res?.data?.success || res?.status === 200;
      if (ok) {
        // clear local messages so optimistic content is removed immediately
        setMessages([]);
        setActionModalVisible(false);
        setSnackbarMsg(res?.data?.message || "User blocked");
        // navigate to chat after a brief delay so snackbar is visible
        setTimeout(() => navigation.navigate("Chat"), 700);
      } else {
        setSnackbarMsg(res?.data?.error || "Unable to block user");
      }
    } catch (err) {
      console.error("Block error", (err as any)?.response?.data || err);
      Alert.alert("Error", "Unable to block user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportUser = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const storedToken = token || (await AsyncStorage.getItem("token"));
      const targetIdNum = userId ? parseInt(String(userId), 10) : null;
      if (!targetIdNum) throw new Error("Missing targetId");

      const res = await api.post(
        "/rating/report",
        { targetId: targetIdNum, reason: "Reported from chat" },
        storedToken
          ? { headers: { Authorization: `Bearer ${storedToken}` } }
          : undefined
      );
      console.debug("Report response:", res?.data);
      const ok = res?.data?.success || res?.status === 200;
      if (ok) {
        setMessages([]);
        setActionModalVisible(false);
        setSnackbarMsg(res?.data?.message || "User reported");
        setTimeout(() => navigation.navigate("Chat"), 700);
      } else {
        setSnackbarMsg(res?.data?.error || "Unable to report user");
      }
    } catch (err) {
      console.error("Report error", (err as any)?.response?.data || err);
      Alert.alert("Error", "Unable to report user");
    } finally {
      setActionLoading(false);
    }
  };

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
    <>
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
            <TouchableOpacity onPress={() => openUserProfile()}>
              <Image
                source={{
                  uri:
                    profilePhoto ||
                    "https://randomuser.me/api/portraits/lego/1.jpg",
                }}
                style={styles.userImage}
              />
            </TouchableOpacity>
            <Text style={styles.headerText}>{name}</Text>
            {/* three-dot menu placed in header so it's visible even when navigator header is hidden */}
            <TouchableOpacity
              style={{ marginLeft: "auto", paddingHorizontal: wp(3) }}
              onPress={() => setActionModalVisible(true)}
            >
              <Ionicons name="ellipsis-vertical" size={hp(3)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profile Modal shown when tapping the user image */}
          <Modal
            visible={profileModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setProfileModalVisible(false)}
          >
            <View style={styles.actionModalOverlay}>
              <View style={[styles.actionModalBox, { width: "90%" }]}>
                {profileLoading ? (
                  <ActivityIndicator size="large" color="#6366f1" />
                ) : profileUser ? (
                  <View style={{ alignItems: "center" }}>
                    <Image
                      source={
                        profileUser.profilePhoto
                          ? { uri: profileUser.profilePhoto }
                          : require("../../assets/images/default.png")
                      }
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 50,
                        marginBottom: 12,
                      }}
                    />
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>
                      {profileUser.name}
                    </Text>
                    <Text style={{ color: "#6b7280", marginBottom: 8 }}>
                      {profileUser.role || ""}
                    </Text>
                    <Text style={{ color: "#374151", marginBottom: 6 }}>
                      {profileUser.address || ""}
                    </Text>
                    <Text style={{ color: "#374151", marginBottom: 12 }}>
                      {profileUser.gender
                        ? `Gender: ${profileUser.gender}`
                        : ""}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        width: "100%",
                        justifyContent: "space-around",
                      }}
                    >
                      <TouchableOpacity
                        style={[styles.actionItem, { flex: 1, marginRight: 6 }]}
                        onPress={() => {
                          const phone =
                            profileUser.phoneNumber ||
                            profileUser.phone ||
                            null;
                          if (phone) Linking.openURL(`tel:${phone}`);
                        }}
                      >
                        <Text style={[styles.actionText, { color: "#065f46" }]}>
                          Call
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionItem, { flex: 1, marginLeft: 6 }]}
                        onPress={() => setProfileModalVisible(false)}
                      >
                        <Text style={styles.actionText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Text>No profile available</Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContainer}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
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
          {/* Action modal for Give rating / Block / Report */}
          <Modal
            visible={actionModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setActionModalVisible(false)}
          >
            <View style={styles.actionModalOverlay}>
              <View style={styles.actionModalBox}>
                <TouchableOpacity
                  style={[
                    styles.actionItem,
                    actionLoading ? { opacity: 0.6 } : null,
                  ]}
                  onPress={() => {
                    if (actionLoading) return;
                    setActionModalVisible(false);
                    navigation.navigate("ReveiwForm", {
                      providerId: userId
                        ? parseInt(String(userId), 10)
                        : userId,
                      providerName: name,
                      providerPhoto: profilePhoto,
                    });
                  }}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionText}>Give rating</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionItem,
                    actionLoading ? { opacity: 0.6 } : null,
                  ]}
                  onPress={() =>
                    Alert.alert(
                      "Confirm block",
                      "Are you sure you want to block this user? They will no longer be able to message you.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Block",
                          style: "destructive",
                          onPress: () => {
                            handleBlockUser();
                          },
                        },
                      ]
                    )
                  }
                  disabled={actionLoading}
                >
                  <Text style={[styles.actionText, { color: "#ef4444" }]}>
                    Block user
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionItem,
                    actionLoading ? { opacity: 0.6 } : null,
                  ]}
                  onPress={handleReportUser}
                  disabled={actionLoading}
                >
                  <Text style={[styles.actionText, { color: "#f59e0b" }]}>
                    Report spam
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItem, { marginTop: 8 }]}
                  onPress={() => setActionModalVisible(false)}
                >
                  <Text style={styles.actionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Snackbar message={snackbarMsg} onDismiss={() => setSnackbarMsg(null)} />
    </>
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
  actionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionModalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "stretch",
  },
  actionItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  actionText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
});
