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
  StackActions,
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

  if (loading) return null; // optional: show loader/spinner here
  // Match the same role string AppNavigator expects ("serviceProvider").
  // Allow common case variants (case-insensitive) but prefer the camelCase value
  const isServiceProvider =
    role === "serviceProvider" ||
    (role || "").toLowerCase() === "serviceprovider";

  return (
    <View style={styles.tabBar}>
      {/* Home */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.dispatch(StackActions.replace("Home"))}
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
        onPress={() => navigation.dispatch(StackActions.replace("Chat"))}
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

      {/* My Services */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() =>
          navigation.dispatch(StackActions.replace("Subscription"))
        }
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

      {/* My Services */}
      {isServiceProvider && (
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            // Only attempt to go to MyServices when we believe the user is a
            // service provider. Otherwise fall back to the Subscription screen
            // to avoid dispatching replace for an unregistered route.
            if (isServiceProvider) {
              navigation.dispatch(StackActions.replace("MyServices"));
            } else {
              navigation.dispatch(StackActions.replace("Subscription"));
            }
          }}
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
        onPress={() => navigation.dispatch(StackActions.replace("Profile"))}
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
    elevation: 15,
  },
  tabItem: { alignItems: "center" },
  tabText: { fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: "700" },
});
