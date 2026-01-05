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
import { LinearGradient } from "expo-linear-gradient";
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
import serviceTypesApi from "../services/serviceTypes";
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
  const [isSending, setIsSending] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [contactRequestSent, setContactRequestSent] = useState(false);
  const [contactRequestApproved, setContactRequestApproved] = useState(false);
  const [pendingContactRequest, setPendingContactRequest] = useState<any>(null);
  const [contactApprovalModalVisible, setContactApprovalModalVisible] =
    useState(false);
  const [lastReceivedQuestion, setLastReceivedQuestion] = useState<
    string | null
  >(null);
  const [hasRespondedToQuestion, setHasRespondedToQuestion] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>([]);
  const [workingHoursModalVisible, setWorkingHoursModalVisible] =
    useState(false);
  const [experienceModalVisible, setExperienceModalVisible] = useState(false);
  const [experienceInput, setExperienceInput] = useState("");
  const [fullTimePartTimeModalVisible, setFullTimePartTimeModalVisible] =
    useState(false);
  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [phoneNumberModalVisible, setPhoneNumberModalVisible] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Message templates for users
  const messageTemplates = [
    "Are you available for work?",
    "What are your working hours?",
    "Can you work on weekends?",
    "What is your experience?",
    "Are you available full-time or part-time?",
    "Can you start immediately?",
    "What services do you provide?",
    "Can we discuss the work details?",
    "Can you share your contact number?",
  ];

  // Yes/No responses for service providers
  const yesNoResponses = ["Yes", "No"];

  // Helper to get display label for time slots
  const getTimeSlotLabel = (slot: string) => {
    const labels: { [key: string]: string } = {
      morning: "🌅 Morning",
      afternoon: "☀️ Afternoon",
      evening: "🌇 Evening",
      night: "🌙 Night",
    };
    return labels[slot] || slot;
  };

  // Check if last question is about working hours
  const isWorkingHoursQuestion = () => {
    return (
      lastReceivedQuestion?.toLowerCase().includes("working hours") ||
      lastReceivedQuestion?.toLowerCase().includes("work hours")
    );
  };

  // Check if last question is about experience
  const isExperienceQuestion = () => {
    return lastReceivedQuestion?.toLowerCase().includes("experience");
  };

  // Check if last question is about full-time/part-time
  const isFullTimePartTimeQuestion = () => {
    return (
      lastReceivedQuestion?.toLowerCase().includes("full-time") ||
      lastReceivedQuestion?.toLowerCase().includes("part-time") ||
      lastReceivedQuestion?.toLowerCase().includes("full time") ||
      lastReceivedQuestion?.toLowerCase().includes("part time")
    );
  };

  // Check if last question is about services
  const isServicesQuestion = () => {
    return (
      lastReceivedQuestion?.toLowerCase().includes("services do you provide") ||
      lastReceivedQuestion?.toLowerCase().includes("what services")
    );
  };

  // Check if last question is about contact number
  const isContactNumberQuestion = () => {
    return (
      lastReceivedQuestion?.toLowerCase().includes("contact number") ||
      lastReceivedQuestion?.toLowerCase().includes("phone number")
    );
  };

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
      console.error("❌ No userId in route params, redirecting to Chat");
      Alert.alert("Error", "Unable to open chat. Please try again.", [
        {
          text: "OK",
          onPress: () => {
            try {
              navigation.dispatch(StackActions.replace("Chat"));
            } catch {
              navigation.goBack();
            }
          },
        },
      ]);
    } else {
      console.log("✅ ChatBox opened for userId:", userId);
    }
  }, [userId, navigation]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");
        const storedToken = await AsyncStorage.getItem("token");
        const storedRole = await AsyncStorage.getItem("userRole");
        console.log(
          "👤 Fetched user from storage - ID:",
          storedId,
          "Token:",
          storedToken ? "exists" : "missing",
          "Role:",
          storedRole
        );

        if (!storedId || !storedToken) {
          console.error("❌ No user found in storage, redirecting to login");
          Alert.alert("Session Expired", "Please login again to continue", [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login" as never),
            },
          ]);
          return;
        }

        setMyId(storedId);
        setToken(storedToken);
        setUserRole(storedRole);

        // Set all available time slots for service providers
        if (storedRole === "serviceProvider") {
          // Always show all time slot options, not just configured ones
          setAvailabilitySlots(["morning", "afternoon", "evening", "night"]);
          console.log("📅 Loaded availability slots: morning, afternoon, evening, night");
        }

        // Fetch service types list for all users (needed for question 7)
        try {
          const servicesRes = await serviceTypesApi.getAll();
          setServicesList(servicesRes.data || []);
          console.log("📋 Loaded services list:", servicesRes.data?.length);
        } catch (err) {
          console.warn("Failed to load services list", err);
        }
      } catch (error) {
        console.error("❌ Error fetching user from storage:", error);
        Alert.alert(
          "Error",
          "Unable to load user session. Please login again."
        );
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!myId) return;

    // Disconnect any existing socket before creating a new one
    if (socketRef.current) {
      console.log("🔌 Disconnecting existing socket");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log("🔌 Initializing socket connection for user:", myId);
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      forceNew: true, // Force new connection to prevent duplicate listeners
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id, "User:", myId);
      socket.emit("register", myId);
    });

    socket.on("receiveMessage", (msg: Message) => {
      console.log("📨 Received message:", msg);

      // Create a unique key for this message
      const messageKey = `${msg.senderId}-${msg.receiverId}-${msg.message}-${msg.createdAt}`;

      // Check if we've already processed this message
      if (
        processedMessageIds.current.has(messageKey) ||
        processedMessageIds.current.has(msg.id)
      ) {
        console.log("⚠️ Duplicate message detected, skipping:", msg.id);
        return;
      }

      // Mark this message as processed
      processedMessageIds.current.add(messageKey);
      processedMessageIds.current.add(msg.id);

      console.log("✅ Adding new message to state");
      setMessages((prev) => [...prev, msg]);

      // Track last received question for service providers
      if (String(msg.receiverId) === String(myId)) {
        setLastReceivedQuestion(msg.message);
        setHasRespondedToQuestion(false); // Reset response flag for new question
      }
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

    // Listen for incoming contact requests (for service providers)
    socket.on("contactRequest", (data: any) => {
      console.log("📞 Contact request received:", data);
      if (String(data.providerId) === String(myId)) {
        setPendingContactRequest(data);
        setContactApprovalModalVisible(true);
      }
    });

    // Listen for contact request approval (for users)
    socket.on("contactRequestApproved", (data: any) => {
      console.log("✅ Contact request approved:", data);
      if (String(data.requesterId) === String(myId)) {
        setContactRequestApproved(true);
        
        // Add notification message in chat with phone number
        const phoneNumber = data.providerPhone || "Not available";
        const providerName = data.providerName || "Service Provider";
        const notificationMsg: Message = {
          id: `notification-${Date.now()}`,
          senderId: "system",
          receiverId: myId,
          message: `✅ Contact request approved!\n\n${providerName}'s Contact Number:\n📞 ${phoneNumber}\n\nYou can now call the service provider.`,
          createdAt: new Date().toISOString(),
          read: true,
          liked: false,
        };
        setMessages((prev) => [...prev, notificationMsg]);
        
        Alert.alert(
          "Request Approved",
          `The service provider has approved your contact request.\n\nContact: ${phoneNumber}`
        );
      }
    });

    // Listen for contact request rejection (for users)
    socket.on("contactRequestRejected", (data: any) => {
      console.log("❌ Contact request rejected:", data);
      if (String(data.requesterId) === String(myId)) {
        setContactRequestSent(false);
        
        // Add notification message in chat
        const notificationMsg: Message = {
          id: `notification-${Date.now()}`,
          senderId: "system",
          receiverId: myId,
          message: "❌ Contact request declined by service provider.",
          createdAt: new Date().toISOString(),
          read: true,
          liked: false,
        };
        setMessages((prev) => [...prev, notificationMsg]);
        
        Alert.alert(
          "Request Declined",
          "The service provider has declined your contact request."
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
        console.log("📥 Fetching messages between", myId, "and", userId);
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
        console.log("📥 Fetched messages response:", res.data);
        if (res.data.success) {
          console.log("📥 Setting", res.data.messages.length, "messages");
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [myId, userId, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Add header right menu (three dots) for rating/block/report
  useEffect(() => {
    try {
      (navigation as any).setOptions({
        headerRight: () => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: wp(3),
            }}
          >
            {/* Call Icon for Contact Request (Users only) */}
            {userRole === "user" && (
              <TouchableOpacity
                onPress={async () => {
                  if (contactRequestApproved) {
                    // If approved, directly call
                    try {
                      const token = await AsyncStorage.getItem("token");
                      const headers = token
                        ? { Authorization: `Bearer ${token}` }
                        : undefined;
                      const res = await api.get(`/users/${userId}`, {
                        headers,
                      });
                      const phone =
                        res?.data?.user?.phoneNumber || res?.data?.phoneNumber;
                      if (phone) {
                        Linking.openURL(`tel:${phone}`);
                      } else {
                        Alert.alert(
                          "No phone number",
                          "This user's phone number is not available."
                        );
                      }
                    } catch (e) {
                      console.warn("Failed to get phone number", e);
                      Alert.alert("Error", "Unable to get phone number");
                    }
                  } else if (contactRequestSent) {
                    Alert.alert(
                      "Request Pending",
                      "Your contact request is waiting for approval."
                    );
                  } else {
                    // Send contact request
                    Alert.alert(
                      "Request Contact",
                      "Do you want to request this service provider's contact number?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Request",
                          onPress: () => {
                            socketRef.current?.emit("contactRequest", {
                              requesterId: myId,
                              providerId: userId,
                              userName: name,
                            });
                            setContactRequestSent(true);
                            
                            // Add notification message in chat
                            const notificationMsg: Message = {
                              id: `notification-${Date.now()}`,
                              senderId: "system",
                              receiverId: myId,
                              message: "📞 Contact request sent. Waiting for approval...",
                              createdAt: new Date().toISOString(),
                              read: true,
                              liked: false,
                            };
                            setMessages((prev) => [...prev, notificationMsg]);
                            
                            Alert.alert(
                              "Request Sent",
                              "Waiting for service provider approval."
                            );
                          },
                        },
                      ]
                    );
                  }
                }}
                style={{ marginRight: 12 }}
              >
                <Ionicons
                  name={
                    contactRequestApproved
                      ? "call"
                      : contactRequestSent
                      ? "time-outline"
                      : "call-outline"
                  }
                  size={hp(2.8)}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
            {/* Three dots menu */}
            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(true);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={hp(3)} color="#fff" />
            </TouchableOpacity>
          </View>
        ),
      });
    } catch (err) {
      // ignore setOptions errors on older navigators
    }
  }, [
    navigation,
    token,
    userId,
    userRole,
    contactRequestSent,
    contactRequestApproved,
  ]);

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

  const sendMessageDirect = async (messageText: string) => {
    if (!messageText.trim() || !token || !myId || isSending) return;

    if (containsRestrictedWords(messageText)) {
      Alert.alert("⚠️ Warning", "Your message contains inappropriate words.");
      return;
    }

    setIsSending(true);

    const newMessage: Message = {
      id: Math.random().toString(),
      senderId: myId,
      receiverId: userId,
      message: messageText.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      liked: false,
    };
    console.log("📤 Sending message:", newMessage);

    // Mark this message as already processed to prevent duplicate when server echoes back
    const messageKey = `${newMessage.senderId}-${newMessage.receiverId}-${newMessage.message}-${newMessage.createdAt}`;
    processedMessageIds.current.add(messageKey);
    processedMessageIds.current.add(newMessage.id);

    // Add message to local state immediately (optimistic update)
    setMessages((prev) => [...prev, newMessage]);

    socketRef.current?.emit("sendMessage", newMessage);

    // Mark that provider has responded to the question
    if (userRole === "serviceProvider") {
      setHasRespondedToQuestion(true);
    }

    setIsSending(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !token || !myId || isSending) return;

    if (containsRestrictedWords(input)) {
      Alert.alert("⚠️ Warning", "Your message contains inappropriate words.");
      return;
    }

    setIsSending(true);

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
      } finally {
        setIsSending(false);
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
      console.log("📤 Sending message:", newMessage);

      // Mark this message as already processed to prevent duplicate when server echoes back
      const messageKey = `${newMessage.senderId}-${newMessage.receiverId}-${newMessage.message}-${newMessage.createdAt}`;
      processedMessageIds.current.add(messageKey);
      processedMessageIds.current.add(newMessage.id);

      // Add message to local state immediately (optimistic update)
      setMessages((prev) => [...prev, newMessage]);

      // Clear input immediately to prevent re-sending
      setInput("");

      socketRef.current?.emit("sendMessage", newMessage);

      // Mark that provider has responded to the question
      if (userRole === "serviceProvider") {
        setHasRespondedToQuestion(true);
      }

      // rely on socket to persist and emit the saved message; stop sending POST to avoid duplicate emits
      setIsSending(false);
    }
  };

  const likeMessage = (msg: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, liked: !m.liked } : m))
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = String(item.senderId) === String(myId);
    const isSystemNotification = item.senderId === "system";
    
    // Render system notifications differently
    if (isSystemNotification) {
      return (
        <View style={[styles.messageWrapper, { alignSelf: "center", maxWidth: "90%" }]}>
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: "#f0fdf4",
                borderWidth: 1,
                borderColor: "#86efac",
                borderRadius: 12,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: "#166534", textAlign: "center", fontSize: 14 }]}>
              {item.message}
            </Text>
          </View>
        </View>
      );
    }
    
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
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>
            {item.message}
          </Text>
          <View style={styles.timeWrapper}>
            <Text
              style={[
                styles.timeText,
                isMe && { color: "rgba(255,255,255,0.8)" },
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {isMe && item.read && <Text style={styles.readText}>✓✓</Text>}
            <Text style={{ marginLeft: 4, fontSize: 14 }}>
              {item.liked ? "❤️" : ""}
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
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          keyboardVerticalOffset={Platform.OS === "ios" ? hp(1) : 0}
        >
          <LinearGradient
            colors={["#6366f1", "#8b5cf6", "#c084fc"]}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openUserProfile()}
                style={styles.userImageWrapper}
              >
                <Image
                  source={{
                    uri:
                      profilePhoto ||
                      "https://randomuser.me/api/portraits/lego/1.jpg",
                  }}
                  style={styles.userImage}
                />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerText} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.headerStatus}>Active now</Text>
              </View>
              {/* Call button hidden as per requirements */}
              {/* <TouchableOpacity
                style={styles.callButton}
                onPress={async () => {
                  if (contactRequestApproved) {
                    // If approved, make the call
                    try {
                      const token = await AsyncStorage.getItem("token");
                      const headers = token
                        ? { Authorization: `Bearer ${token}` }
                        : undefined;
                      const res = await api.get(`/users/${userId}`, { headers });
                      const phone =
                        res?.data?.user?.phoneNumber || res?.data?.phoneNumber;
                      if (phone) {
                        Linking.openURL(`tel:${phone}`);
                      } else {
                        Alert.alert(
                          "No phone number",
                          "This user's phone number is not available."
                        );
                      }
                    } catch (e) {
                      console.warn("Failed to get phone number", e);
                      Alert.alert("Error", "Unable to get phone number");
                    }
                  } else if (contactRequestSent) {
                    // Request already sent
                    Alert.alert(
                      "Request Pending",
                      "Your contact request is waiting for approval."
                    );
                  } else {
                    // Send contact request
                    Alert.alert(
                      "Request Contact",
                      "Do you want to request this service provider's contact number?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Request",
                          onPress: async () => {
                            try {
                              const token = await AsyncStorage.getItem("token");
                              const senderId = await AsyncStorage.getItem("userId");
                              
                              // Send contact request via socket
                              const requestData = {
                                requesterId: senderId,
                                providerId: userId,
                                requesterName: "User", // Will be replaced by backend
                                timestamp: new Date().toISOString(),
                              };
                              
                              socketRef.current?.emit("contactRequest", requestData);
                              setContactRequestSent(true);
                              Alert.alert(
                                "Request Sent",
                                "Your contact request has been sent. You'll be notified when approved."
                              );
                            } catch (e) {
                              console.error("Failed to send contact request", e);
                              Alert.alert("Error", "Unable to send request");
                            }
                          },
                        },
                      ]
                    );
                  }
                }}
              >
                <Ionicons 
                  name={contactRequestApproved ? "call" : contactRequestSent ? "time" : "call-outline"} 
                  size={22} 
                  color="#fff" 
                />
              </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setActionModalVisible(true)}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

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
                        profileUser.profilePhoto &&
                        (profileUser.profilePhoto.startsWith("http://") ||
                          profileUser.profilePhoto.startsWith("https://"))
                          ? { uri: profileUser.profilePhoto }
                          : require("../../assets/images/default.png")
                      }
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 50,
                        marginBottom: 12,
                      }}
                      onError={() => {
                        // Silently fallback - already using placeholder
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
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>
                  No messages yet. Start chatting!
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
                  Debug: Messages count: {messages.length}
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                  MyId: {myId} | UserId: {userId}
                </Text>
              </View>
            }
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
              {
                paddingBottom:
                  Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 8,
              },
            ]}
          >
            {userRole === "serviceProvider" ? (
              // Service providers see different options based on question
              isWorkingHoursQuestion() && availabilitySlots.length > 0 ? (
                // Show time slot selection for working hours question
                <View style={styles.inputWrapper}>
                  <TouchableOpacity
                    style={styles.templateButton}
                    onPress={() => setWorkingHoursModalVisible(true)}
                    disabled={isSending}
                  >
                    <Ionicons name="time-outline" size={20} color="#6366f1" />
                    <Text style={styles.templateButtonText}>
                      Select Working Hours
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : isExperienceQuestion() ? (
                // Show experience input for experience question
                <View style={styles.inputWrapper}>
                  <TouchableOpacity
                    style={styles.templateButton}
                    onPress={() => setExperienceModalVisible(true)}
                    disabled={isSending}
                  >
                    <Ionicons name="medal-outline" size={20} color="#6366f1" />
                    <Text style={styles.templateButtonText}>
                      Enter Experience
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : isFullTimePartTimeQuestion() && !hasRespondedToQuestion ? (
                // Show Full-time/Part-time buttons for availability type question
                <View style={styles.yesNoContainer}>
                  <TouchableOpacity
                    style={[styles.yesButton, isSending && { opacity: 0.5 }]}
                    onPress={() => sendMessageDirect("Full-time")}
                    disabled={isSending}
                  >
                    <Text style={styles.yesNoText}>⏰ Full-time</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.noButton, isSending && { opacity: 0.5 }]}
                    onPress={() => sendMessageDirect("Part-time")}
                    disabled={isSending}
                  >
                    <Text style={styles.yesNoText}>🕐 Part-time</Text>
                  </TouchableOpacity>
                </View>
              ) : isServicesQuestion() && servicesList.length > 0 ? (
                // Show services selection for services question
                <View style={styles.inputWrapper}>
                  <TouchableOpacity
                    style={styles.templateButton}
                    onPress={() => {
                      setSelectedServices([]);
                      setServicesModalVisible(true);
                    }}
                    disabled={isSending}
                  >
                    <Ionicons name="list-outline" size={20} color="#6366f1" />
                    <Text style={styles.templateButtonText}>
                      Select Services
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : lastReceivedQuestion && !hasRespondedToQuestion ? (
                // Show Yes/No buttons for other questions (only if hasn't responded)
                <View style={styles.yesNoContainer}>
                  <TouchableOpacity
                    style={[styles.yesButton, isSending && { opacity: 0.5 }]}
                    onPress={() => sendMessageDirect("Yes")}
                    disabled={isSending}
                  >
                    <Text style={styles.yesNoText}>✓ Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.noButton, isSending && { opacity: 0.5 }]}
                    onPress={() => sendMessageDirect("No")}
                    disabled={isSending}
                  >
                    <Text style={styles.yesNoText}>✗ No</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // No question pending - show nothing for service provider
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: "#94a3b8", fontSize: 14 }}>Waiting for a question...</Text>
                </View>
              )
            ) : (
              // Users see template button
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={styles.templateButton}
                  onPress={() => setTemplateModalVisible(true)}
                  disabled={isSending}
                >
                  <Ionicons name="list" size={20} color="#6366f1" />
                  <Text style={styles.templateButtonText}>
                    Choose a message
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* Template Selection Modal for Users */}
          <Modal
            visible={templateModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setTemplateModalVisible(false)}
          >
            <View style={styles.actionModalOverlay}>
              <View style={[styles.actionModalBox, { maxHeight: "70%" }]}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 16,
                    textAlign: "center",
                    color: "#1f2937",
                  }}
                >
                  Choose a Message
                </Text>
                <FlatList
                  data={messageTemplates}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.templateItem}
                      onPress={() => {
                        // Special handling for contact number question
                        if (
                          item.toLowerCase().includes("contact number") ||
                          item.toLowerCase().includes("phone number")
                        ) {
                          setTemplateModalVisible(false);
                          // Trigger contact request instead of sending as message
                          Alert.alert(
                            "Request Contact",
                            "Do you want to request this service provider's contact number?",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Request",
                                onPress: () => {
                                  socketRef.current?.emit("contactRequest", {
                                    requesterId: myId,
                                    providerId: userId,
                                    userName: name,
                                  });
                                  setContactRequestSent(true);
                                  
                                  // Add notification message in chat
                                  const notificationMsg: Message = {
                                    id: `notification-${Date.now()}`,
                                    senderId: "system",
                                    receiverId: myId,
                                    message: "📞 Contact request sent. Waiting for approval...",
                                    createdAt: new Date().toISOString(),
                                    read: true,
                                    liked: false,
                                  };
                                  setMessages((prev) => [...prev, notificationMsg]);
                                  
                                  Alert.alert(
                                    "Request Sent",
                                    "Waiting for service provider approval."
                                  );
                                },
                              },
                            ]
                          );
                        } else {
                          // Regular template message - use direct send
                          setTemplateModalVisible(false);
                          sendMessageDirect(item);
                        }
                      }}
                    >
                      <Text style={styles.templateItemText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={[styles.actionItem, { marginTop: 12 }]}
                  onPress={() => setTemplateModalVisible(false)}
                >
                  <Text style={styles.actionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Working Hours Selection Modal for Service Providers */}
          <Modal
            visible={workingHoursModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setWorkingHoursModalVisible(false)}
          >
            <View style={styles.actionModalOverlay}>
              <View style={[styles.actionModalBox, { maxHeight: "60%" }]}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 16,
                    textAlign: "center",
                    color: "#1f2937",
                  }}
                >
                  🕐 Select Your Working Hours
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    marginBottom: 16,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Tap one or multiple time slots to send
                </Text>
                <FlatList
                  data={availabilitySlots}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.templateItem, styles.timeSlotItem]}
                      onPress={() => {
                        const message = `I work in the ${item}`;
                        sendMessageDirect(message);
                        // Don't close modal - allow multiple selections
                      }}
                    >
                      <Text style={styles.templateItemText}>
                        {getTimeSlotLabel(item)}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={[styles.actionItem, { marginTop: 12 }]}
                  onPress={() => setWorkingHoursModalVisible(false)}
                >
                  <Text style={styles.actionText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Experience Input Modal for Service Providers */}
          <Modal
            visible={experienceModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setExperienceModalVisible(false)}
          >
            <View style={styles.actionModalOverlay}>
              <View style={[styles.actionModalBox, { maxHeight: "40%" }]}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 16,
                    textAlign: "center",
                    color: "#1f2937",
                  }}
                >
                  🏅 Enter Your Experience
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    marginBottom: 16,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Enter years of experience (e.g., 5)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      backgroundColor: "#ffffff",
                      color: "#1e293b",
                      textAlign: "center",
                      fontWeight: "600",
                    },
                  ]}
                  placeholder="e.g., 5"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={experienceInput}
                  onChangeText={setExperienceInput}
                  maxLength={2}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.yesButton, { marginTop: 16 }]}
                  onPress={() => {
                    if (experienceInput.trim()) {
                      sendMessageDirect(`${experienceInput} years of experience`);
                      setExperienceModalVisible(false);
                      setExperienceInput("");
                    } else {
                      Alert.alert(
                        "Required",
                        "Please enter your experience in years"
                      );
                    }
                  }}
                >
                  <Text style={styles.yesNoText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionItem, { marginTop: 12 }]}
                  onPress={() => {
                    setExperienceModalVisible(false);
                    setExperienceInput("");
                  }}
                >
                  <Text style={styles.actionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Services Selection Modal for Service Providers */}
          <Modal
            visible={servicesModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setServicesModalVisible(false)}
          >
            <View style={styles.actionModalOverlay}>
              <View style={[styles.actionModalBox, { maxHeight: "70%" }]}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 16,
                    textAlign: "center",
                    color: "#1f2937",
                  }}
                >
                  🛠️ Select Your Services
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    marginBottom: 16,
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Tap one or multiple services, then tap Done
                </Text>
                <FlatList
                  data={servicesList}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => {
                    const isSelected = selectedServices.includes(item.id);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.templateItem,
                          isSelected && styles.timeSlotItem,
                        ]}
                        onPress={() => {
                          setSelectedServices((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id]
                          );
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={24}
                            color={isSelected ? "#6366f1" : "#94a3b8"}
                            style={{ marginRight: 12 }}
                          />
                          <Text style={styles.templateItemText}>
                            {item.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
                <TouchableOpacity
                  style={[styles.yesButton, { marginTop: 16 }]}
                  onPress={() => {
                    if (selectedServices.length > 0) {
                      const serviceNames = servicesList
                        .filter((s) => selectedServices.includes(s.id))
                        .map((s) => s.name)
                        .join(", ");
                      sendMessageDirect(`I provide: ${serviceNames}`);
                      setServicesModalVisible(false);
                    } else {
                      Alert.alert(
                        "Required",
                        "Please select at least one service"
                      );
                    }
                  }}
                >
                  <Text style={styles.yesNoText}>
                    Send ({selectedServices.length} selected)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionItem, { marginTop: 12 }]}
                  onPress={() => {
                    setServicesModalVisible(false);
                    setSelectedServices([]);
                  }}
                >
                  <Text style={styles.actionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Contact Approval Modal for Service Providers */}
          <Modal
            visible={contactApprovalModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setContactApprovalModalVisible(false)}
          >
            <View style={styles.actionModalOverlay}>
              <View style={styles.actionModalBox}>
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <Ionicons name="call" size={48} color="#6366f1" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      marginTop: 12,
                      textAlign: "center",
                      color: "#1f2937",
                    }}
                  >
                    Contact Request
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      marginTop: 8,
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    {pendingContactRequest?.requesterName || "A user"} wants to
                    request your contact number
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.approvalButton, styles.rejectButton]}
                    onPress={() => {
                      if (pendingContactRequest) {
                        socketRef.current?.emit("contactRequestResponse", {
                          ...pendingContactRequest,
                          approved: false,
                        });
                      }
                      setContactApprovalModalVisible(false);
                      setPendingContactRequest(null);
                    }}
                  >
                    <Text style={styles.approvalButtonText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.approvalButton, styles.approveButton]}
                    onPress={() => {
                      if (pendingContactRequest) {
                        socketRef.current?.emit("contactRequestResponse", {
                          ...pendingContactRequest,
                          approved: true,
                        });
                        Alert.alert(
                          "Approved",
                          "Contact request approved. The user can now call you."
                        );
                      }
                      setContactApprovalModalVisible(false);
                      setPendingContactRequest(null);
                    }}
                  >
                    <Text style={styles.approvalButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },

  headerGradient: {
    // No extra padding - SafeAreaView handles the top inset
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userImageWrapper: {
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerStatus: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  chatContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageWrapper: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  alignRight: { alignSelf: "flex-end" },
  alignLeft: { alignSelf: "flex-start" },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  myMessage: {
    backgroundColor: "#8b5cf6",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  messageText: {
    fontSize: 15,
    color: "#1e293b",
    lineHeight: 20,
  },
  myMessageText: {
    color: "#ffffff",
  },
  timeWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  readText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginLeft: 2,
  },

  inputContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  actionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionModalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  actionItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderRadius: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: "#1e293b",
  },

  // Template Selection Styles
  templateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  templateButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6366f1",
  },
  templateItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fafafa",
    marginVertical: 4,
    borderRadius: 8,
  },
  templateItemText: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },

  // Time slot specific styling
  timeSlotItem: {
    backgroundColor: "#eff6ff",
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
  },

  // Yes/No Button Styles
  yesNoContainer: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
  },
  yesButton: {
    flex: 1,
    backgroundColor: "#10b981",
    borderRadius: 24,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  noButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    borderRadius: 24,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  // Contact Approval Modal Styles
  approvalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  approveButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  approvalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});
