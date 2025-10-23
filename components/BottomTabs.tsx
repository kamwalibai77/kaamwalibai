// app/components/BottomTabs.tsx
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import io from "socket.io-client";
import { SOCKET_URL } from "../app/utills/config";

export default function BottomTabs() {
  const navigation =
    useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const route = useRoute();

  const pathname = route.name as string;

  const activeColor = "#4f46e5"; // stylish purple-blue
  const inactiveColor = "#94a3b8"; // soft gray

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const socketRef = React.useRef<any>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        setRole(storedRole);
      } catch (err) {
        console.log("Error fetching role:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  // fetch unread counts for chat and listen to socket events to update badge
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        // fetch chat list which includes unreadCount per chat
        const res = await axios.get(`${SOCKET_URL}/api/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && res.data.chats) {
          const total = res.data.chats.reduce(
            (acc: number, c: any) => acc + (c.unreadCount || 0),
            0
          );
          if (mounted) setUnreadCount(total);
        }

        // connect socket and listen for receiveMessage to increment unread
        const storedId = await AsyncStorage.getItem("userId");
        if (!storedId) return;
        const socket = io(SOCKET_URL, { transports: ["websocket"] });
        socketRef.current = socket;
        socket.on("connect", () => socket.emit("register", storedId));
        socket.on("receiveMessage", (msg: any) => {
          // If message is to current user, increment badge
          const myId = storedId;
          if (String(msg.receiverId) === String(myId)) {
            setUnreadCount((prev) => prev + 1);
          }
        });
        socket.on("messageBlocked", () => {
          // no change
        });
        socket.on("subscriptionPurchased", (data: any) => {
          // optionally show a transient badge for subscription
          // we'll increment unreadCount to show notification presence
          setUnreadCount((prev) => prev + 1);
        });
      } catch (e) {
        console.warn("BottomTabs init error", e);
      }
    };
    init();
    return () => {
      mounted = false;
      try {
        socketRef.current?.disconnect();
      } catch {}
    };
  }, []);

  if (loading) return null;

  const isServiceProvider =
    role === "serviceProvider" ||
    (role || "").toLowerCase() === "serviceprovider";

  return (
    <View style={styles.tabBar}>
      {/* Home */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate("Home")}
      >
        <Ionicons
          name="home-outline"
          size={28}
          color={pathname === "Home" ? activeColor : inactiveColor}
        />
        <Text
          style={[
            styles.tabText,
            { color: pathname === "Home" ? activeColor : inactiveColor },
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Chat */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => {
          setUnreadCount(0);
          navigation.navigate("Chat");
        }}
      >
        <MaterialCommunityIcons
          name="chat-processing-outline"
          size={28}
          color={pathname === "Chat" ? activeColor : inactiveColor}
        />
        <View style={{ position: "relative", alignItems: "center" }}>
          <Text
            style={[
              styles.tabText,
              { color: pathname === "Chat" ? activeColor : inactiveColor },
            ]}
          >
            Chat
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Subscriptions */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate("Subscription")}
      >
        <FontAwesome5
          name="briefcase"
          size={26}
          color={pathname === "Subscription" ? activeColor : inactiveColor}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: pathname === "Subscription" ? activeColor : inactiveColor,
            },
          ]}
        >
          Subscriptions
        </Text>
      </TouchableOpacity>

      {/* My Services (for Service Providers only) */}
      {isServiceProvider && (
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("MyServices")}
        >
          <FontAwesome5
            name="briefcase"
            size={26}
            color={pathname === "MyServices" ? activeColor : inactiveColor}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: pathname === "MyServices" ? activeColor : inactiveColor,
              },
            ]}
          >
            My Services
          </Text>
        </TouchableOpacity>
      )}

      {/* Profile */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons
          name="person-circle-outline"
          size={28}
          color={pathname === "Profile" ? activeColor : inactiveColor}
        />
        <Text
          style={[
            styles.tabText,
            { color: pathname === "Profile" ? activeColor : inactiveColor },
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 8,
    elevation: 4,
  },
  tabItem: { alignItems: "center" },
  tabText: { fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: "700" },
  badge: {
    position: "absolute",
    right: -10,
    top: -6,
    backgroundColor: "#ef4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
