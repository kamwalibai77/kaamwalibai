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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";
import { RootStackParamList } from "../navigation/AppNavigator";
import { API_BASE_URL } from "../utills/config";
const PlaceholderImg = require("../../assets/images/default.png");

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props): any {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#c084fc"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerIcons}>
            <Ionicons
              name="settings-outline"
              size={22}
              color="#ffffff"
              onPress={() => navigation.navigate("Settings")}
            />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileImageWrapper}>
              <Image
                source={
                  !imageError && user.profilePhoto
                    ? { uri: user.profilePhoto }
                    : PlaceholderImg
                }
                style={styles.profileImage}
                onError={() => {
                  console.warn(
                    "Profile image failed to load, falling back to placeholder"
                  );
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
              />
              {user.role === "ServiceProvider" &&
                user.kycStatus === "verified" && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={32}
                      color="#10b981"
                    />
                  </View>
                )}
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.roleContainer}>
              <Ionicons
                name={user.role === "ServiceProvider" ? "briefcase" : "person"}
                size={16}
                color="#8b5cf6"
              />
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="#64748b" />
              <Text style={styles.userLocation}>
                {user.address || "Add Location"}
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Personal Details</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="call" size={18} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoText}>
                  {user.phoneNumber || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="home" size={18} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoText}>
                  {user.address || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="person" size={18} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Gender & Age</Text>
                <Text style={styles.infoText}>
                  {user.gender || "NA"}, {user.age || "NA"} years
                </Text>
              </View>
            </View>
          </View>

          {/* Action Section */}
          <View style={styles.actionsContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <View
              style={styles.actionButton}
              onTouchEnd={() => navigation.navigate("EditProfile")}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="pencil" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Edit Profile</Text>
                <Text style={styles.actionDescription}>
                  Update your personal details
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </View>

            {user.role === "ServiceProvider" && (
              <View
                style={styles.actionButton}
                onTouchEnd={() => navigation.navigate("KYC")}
              >
                <View style={styles.actionIconWrapper}>
                  <Ionicons name="document-text" size={20} color="#8b5cf6" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Complete KYC</Text>
                  <Text style={styles.actionDescription}>
                    Verify your account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </View>
            )}

            <View
              style={styles.actionButton}
              onTouchEnd={() => navigation.navigate("Settings")}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="cog" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Settings</Text>
                <Text style={styles.actionDescription}>App preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </View>

            <View style={styles.logoutButton} onTouchEnd={handleLogout}>
              <View
                style={[
                  styles.actionIconWrapper,
                  { backgroundColor: "#fee2e2" },
                ]}
              >
                <Ionicons name="log-out" size={20} color="#ef4444" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: "#ef4444" }]}>
                  Logout
                </Text>
                <Text style={styles.actionDescription}>
                  Sign out from your account
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },

  headerGradient: {
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginTop: -20,
    marginBottom: 20,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  profileImageWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#8b5cf6",
  },
  verifiedBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#8b5cf6",
    fontWeight: "600",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userLocation: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },

  actionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  // Legacy styles removed
  gradient: {},
  actionCard: {},
  actionRow: {},
  actionText: {},
  verifiedInner: {},
});
