// app/components/BottomTabs.tsx
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

export default function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const activeColor = "#4f46e5"; // stylish purple-blue
  const inactiveColor = "#94a3b8"; // soft gray

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return null; // optional: show loader/spinner here

  return (
    <View style={styles.tabBar}>
      {/* Home */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace("/screens/HomeScreen")}
      >
        <Ionicons
          name="home-outline"
          size={28}
          color={pathname.includes("HomeScreen") ? activeColor : inactiveColor}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: pathname.includes("HomeScreen")
                ? activeColor
                : inactiveColor,
            },
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Chat */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace("/screens/ChatScreen")}
      >
        <MaterialCommunityIcons
          name="chat-processing-outline"
          size={28}
          color={pathname.includes("ChatScreen") ? activeColor : inactiveColor}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: pathname.includes("ChatScreen")
                ? activeColor
                : inactiveColor,
            },
          ]}
        >
          Chat
        </Text>
      </TouchableOpacity>

      {/* My Services */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace("/screens/SubscriptionScreen")}
      >
        <FontAwesome5
          name="briefcase"
          size={26}
          color={
            pathname.includes("SubscriptionScreen")
              ? activeColor
              : inactiveColor
          }
        />
        <Text
          style={[
            styles.tabText,
            {
              color: pathname.includes("SubscriptionScreen")
                ? activeColor
                : inactiveColor,
            },
          ]}
        >
          Subscriptions
        </Text>
      </TouchableOpacity>

      {/* My Services */}
      {role === "ServiceProvider" && (
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace("/screens/MyServicesScreen")}
        >
          <FontAwesome5
            name="briefcase"
            size={26}
            color={
              pathname.includes("MyServicesScreen")
                ? activeColor
                : inactiveColor
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color: pathname.includes("MyServicesScreen")
                  ? activeColor
                  : inactiveColor,
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
        onPress={() => router.replace("/screens/ProfileScreen")}
      >
        <Ionicons
          name="person-circle-outline"
          size={28}
          color={
            pathname.includes("ProfileScreen") ? activeColor : inactiveColor
          }
        />
        <Text
          style={[
            styles.tabText,
            {
              color: pathname.includes("ProfileScreen")
                ? activeColor
                : inactiveColor,
            },
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
    elevation: 15,
  },
  tabItem: { alignItems: "center" },
  tabText: { fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: "700" },
});
