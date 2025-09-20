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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTab from "../../components/BottomTabs";

export default function ProfileScreen() {
  const router = useRouter();
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>No user found</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#f9fafb", "#eef2ff"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.profileCard}>
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
            <Ionicons name="pencil-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#6366f1" />
            <Text style={styles.infoText}>{user.mobile || "NA"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="home-outline" size={18} color="#6366f1" />
            <Text style={styles.infoText}>{user.address || "NA"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="male-female-outline" size={18} color="#6366f1" />
            <Text style={styles.infoText}>
              {user.gender || "NA"}, {user.age || "NA"} yrs
            </Text>
          </View>
        </View>
      </ScrollView>
      <BottomTab />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: { paddingVertical: 20, paddingHorizontal: 16 },

  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#6366f1",
    marginBottom: 12,
  },
  userName: { fontSize: 22, fontWeight: "700", color: "#111827" },
  userRole: { fontSize: 15, color: "#6366f1", marginBottom: 4 },
  userLocation: { fontSize: 13, color: "#6b7280" },

  editButton: {
    flexDirection: "row",
    backgroundColor: "#6366f1",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginTop: 12,
    alignItems: "center",
  },
  editButtonText: { color: "#fff", fontWeight: "600", marginLeft: 6 },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoText: { marginLeft: 10, fontSize: 14, color: "#374151" },
});
