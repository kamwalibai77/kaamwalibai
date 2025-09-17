// app/components/BottomTabs.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

export default function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname(); // detect active tab

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace("/screens/HomeScreen")}
      >
        <Ionicons
          name="home"
          size={24}
          color={pathname.includes("HomeScreen") ? "#6366f1" : "#64748b"}
        />
        <Text
          style={[
            styles.tabText,
            { color: pathname.includes("HomeScreen") ? "#6366f1" : "#64748b" },
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace("/screens/ChatScreen")}
      >
        <Ionicons
          name="chatbubbles"
          size={24}
          color={pathname.includes("ChatScreen") ? "#6366f1" : "#64748b"}
        />
        <Text
          style={[
            styles.tabText,
            { color: pathname.includes("ChatScreen") ? "#6366f1" : "#64748b" },
          ]}
        >
          Chat
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace("/screens/MyServicesScreen")}
      >
        <Ionicons
          name="briefcase"
          size={24}
          color={pathname.includes("MyServicesScreen") ? "#6366f1" : "#64748b"}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: pathname.includes("MyServicesScreen")
                ? "#6366f1"
                : "#64748b",
            },
          ]}
        >
          My Services
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace("/screens/ProfileScreen")}
      >
        <Ionicons
          name="person"
          size={24}
          color={pathname.includes("ProfileScreen") ? "#6366f1" : "#64748b"}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: pathname.includes("ProfileScreen") ? "#6366f1" : "#64748b",
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
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 5,
    elevation: 10,
  },
  tabItem: { alignItems: "center" },
  tabText: { fontSize: 12, color: "#64748b", marginTop: 2 },
});
