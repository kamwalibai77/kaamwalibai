// screens/ProfileScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTab from "../../components/BottomTabs";

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) return;

        const response = await fetch(
          `http://localhost:5000/api/users/${userId}`
        );
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No user found</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{
              uri: user.profilePhoto || "https://via.placeholder.com/150",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
          <Text style={styles.userLocation}>
            {user.location || "Not updated"}
          </Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/screens/ProfileEditScreen")}
          >
            <Ionicons name="pencil-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>{user.mobile || "NA"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="home-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>{user.address || "NA"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="male-female-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>
              {user.gender || "NA"}, {user.age || "NA"} yrs
            </Text>
          </View>
        </View>
      </ScrollView>
      {/* Bottom Tabs (same as before) */}
      <BottomTab />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  profileHeader: { alignItems: "center", marginBottom: 24 },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#6366f1",
    marginBottom: 12,
  },
  userName: { fontSize: 24, fontWeight: "700", color: "#1e293b" },
  userRole: { fontSize: 16, color: "#6366f1", marginBottom: 4 },
  userLocation: { fontSize: 14, color: "#64748b" },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#6366f1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  editButtonText: { color: "#fff", fontWeight: "600", marginLeft: 8 },
  infoSection: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { marginLeft: 12, fontSize: 14, color: "#334155" },
});
