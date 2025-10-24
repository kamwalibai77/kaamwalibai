// screens/ProfileScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";
import { RootStackParamList } from "../navigation/AppNavigator";
import { API_BASE_URL } from "../utills/config";
const PlaceholderImg = require("../../assets/images/default.png");

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) return;

        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
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
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No user found</Text>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userId");
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#f9fafb", "#eef2ff"]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileCard}>
            <Image
              source={
                user.profilePhoto ? { uri: user.profilePhoto } : PlaceholderImg
              }
              style={styles.profileImage}
            />
            {/* Verified badge for service providers (small circular badge overlapping avatar) */}
            {user.role === "ServiceProvider" &&
              user.kycStatus === "verified" && (
                <View style={styles.verifiedBadge}>
                  <View style={styles.verifiedInner}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                </View>
              )}
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.role}</Text>
            <Text style={styles.userLocation}>
              {user.address || "Add Location"}
            </Text>
          </View>

          {/* Info Section */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#6366f1" />
              <Text style={styles.infoText}>{user.phoneNumber || "NA"}</Text>
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

          {/* Action Section */}
          <View style={styles.actionCard}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Ionicons name="create-outline" size={20} color="#6366f1" />
              <Text style={styles.actionText}>Edit Profile</Text>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color="#cbd5e1"
              />
            </TouchableOpacity>

            {/* Only show Complete KYC for Service Provider */}
            {user.role === "ServiceProvider" && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => navigation.navigate("KYC")}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#6366f1"
                />
                <Text style={styles.actionText}>Complete KYC</Text>
                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color="#cbd5e1"
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate("Settings")}
            >
              <Ionicons name="settings-outline" size={20} color="#6366f1" />
              <Text style={styles.actionText}>Settings</Text>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color="#cbd5e1"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionText, { color: "#ef4444" }]}>
                Logout
              </Text>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color="#cbd5e1"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
      <BottomTab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  gradient: { flex: 1 },
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100, // ✅ space for BottomTab
  },

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
  verifiedBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    backgroundColor: "transparent",
  },
  verifiedInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: { fontSize: 22, fontWeight: "700", color: "#111827" },
  userRole: { fontSize: 15, color: "#6366f1", marginBottom: 4 },
  userLocation: { fontSize: 13, color: "#6b7280" },

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
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#111827",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    justifyContent: "space-between",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
    color: "#111827",
    flex: 1,
  },
});
