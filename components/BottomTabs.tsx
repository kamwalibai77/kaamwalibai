// app/components/BottomTabs.tsx
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  NavigationProp,
} from "@react-navigation/native";

export default function BottomTabs() {
  const navigation =
    useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const route = useRoute();

  const pathname = route.name as string;

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
        onPress={() => navigation.navigate("Chat")}
      >
        <MaterialCommunityIcons
          name="chat-processing-outline"
          size={28}
          color={pathname === "Chat" ? activeColor : inactiveColor}
        />
        <Text
          style={[
            styles.tabText,
            { color: pathname === "Chat" ? activeColor : inactiveColor },
          ]}
        >
          Chat
        </Text>
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
});
