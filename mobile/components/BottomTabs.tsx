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
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import io from "socket.io-client";
import { SOCKET_URL } from "../app/utills/config";

export default function BottomTabs() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const route = useRoute();

  const pathname = route.name as string;

  // Use black for both active and inactive icons/labels per request
  const activeColor = "#000000";
  const inactiveColor = "#000000";

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
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {/* Home */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("Home")}
        >
          <View
            style={[
              styles.iconWrapper,
              pathname === "Home" && styles.iconActive,
            ]}
          >
            <Ionicons
              name={pathname === "Home" ? "home" : "home-outline"}
              size={20}
              color={pathname === "Home" ? "#ffffff" : "#94a3b8"}
            />
          </View>
          <Text
            style={[
              styles.tabText,
              pathname === "Home" && styles.tabTextActive,
            ]}
          >
            {t("home")}
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
          <View
            style={[
              styles.iconWrapper,
              pathname === "Chat" && styles.iconActive,
            ]}
          >
            <MaterialCommunityIcons
              name={
                pathname === "Chat" ? "message-text" : "message-text-outline"
              }
              size={20}
              color={pathname === "Chat" ? "#ffffff" : "#94a3b8"}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabText,
              pathname === "Chat" && styles.tabTextActive,
            ]}
          >
            {t("chat")}
          </Text>
        </TouchableOpacity>

        {/* Subscriptions */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("Subscription")}
        >
          <View
            style={[
              styles.iconWrapper,
              pathname === "Subscription" && styles.iconActive,
            ]}
          >
            <Ionicons
              name={pathname === "Subscription" ? "diamond" : "diamond-outline"}
              size={20}
              color={pathname === "Subscription" ? "#ffffff" : "#94a3b8"}
            />
          </View>
          <Text
            style={[
              styles.tabText,
              pathname === "Subscription" && styles.tabTextActive,
            ]}
          >
            {t("plans")}
          </Text>
        </TouchableOpacity>

        {/* My Services (for Service Providers only) */}
        {isServiceProvider && (
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              if (isServiceProvider) {
                navigation.navigate("MyServices" as never);
              }
            }}
          >
            <View
              style={[
                styles.iconWrapper,
                pathname === "MyServices" && styles.iconActive,
              ]}
            >
              <FontAwesome5
                name="briefcase"
                size={18}
                color={pathname === "MyServices" ? "#ffffff" : "#94a3b8"}
              />
            </View>
            <Text
              style={[
                styles.tabText,
                pathname === "MyServices" && styles.tabTextActive,
              ]}
            >
              {t("myServices")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Profile */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <View
            style={[
              styles.iconWrapper,
              pathname === "Profile" && styles.iconActive,
            ]}
          >
            <Ionicons
              name={pathname === "Profile" ? "person" : "person-outline"}
              size={20}
              color={pathname === "Profile" ? "#ffffff" : "#94a3b8"}
            />
          </View>
          <Text
            style={[
              styles.tabText,
              pathname === "Profile" && styles.tabTextActive,
            ]}
          >
            {t("myProfile")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingBottom: 2,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
    backgroundColor: "transparent",
    position: "relative",
  },
  iconActive: {
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 0,
  },
  tabTextActive: {
    color: "#6366f1",
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    right: 2,
    top: 0,
    backgroundColor: "#ef4444",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 3,
  },
});
