// screens/ProfileScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Modal,
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
const MaleAvatarImg = require("../../assets/images/male avatar.jpg");

// Helper function to get gender-specific placeholder
const getPlaceholderImage = (gender: string | null | undefined) => {
  if (gender && gender.toLowerCase() === "male") {
    return MaleAvatarImg;
  }
  return PlaceholderImg;
};

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
  icon: string;
};

const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", icon: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", icon: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", icon: "🇮🇳" },
];

export default function ProfileScreen({ navigation }: Props): any {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        // No userId means not logged in, redirect to login
        navigation.replace("Login");
        return;
      }

      // Load saved language preference
      const savedLanguageCode = await AsyncStorage.getItem("appLanguageCode");
      if (savedLanguageCode) {
        i18n.changeLanguage(savedLanguageCode);
      }

      // First, try to load cached user data for immediate display
      const cachedUserData = await AsyncStorage.getItem("userData");
      if (cachedUserData) {
        const parsedUser = JSON.parse(cachedUserData);
        console.log("Loaded cached user data:", parsedUser);
        setUser(parsedUser);
        setImageError(false);
      }

      // Add cache-busting timestamp to prevent stale data
      const timestamp = new Date().getTime();
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/users/${userId}?_t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      // Handle token expiration or unauthorized access
      if (response.status === 401) {
        console.warn("Token expired, logging out...");
        await AsyncStorage.multiRemove([
          "token",
          "userId",
          "userRole",
          "userData",
          "profilePhoto",
        ]);
        navigation.replace("Login");
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fresh user data from API:", data);
      setUser(data);
      setImageError(false); // Reset image error state on new fetch

      // Update cache with fresh data
      await AsyncStorage.setItem("userData", JSON.stringify(data));
    } catch (err) {
      console.error("Error fetching user:", err);
      // Only redirect to login if there's no cached data at all
      const cachedUserData = await AsyncStorage.getItem("userData");
      if (!cachedUserData) {
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigation, i18n]);

  // Refetch user data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser])
  );

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
    // Clear all auth-related data
    await AsyncStorage.multiRemove([
      "token",
      "userId",
      "userRole",
      "userData",
      "profilePhoto",
    ]);
    navigation.replace("Login");
  };

  const handleLanguageSelect = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem("appLanguageCode", languageCode);

    // Also store the language name for backward compatibility
    const langName =
      languageCode === "hi"
        ? "Hindi"
        : languageCode === "mr"
        ? "Marathi"
        : "English";
    await AsyncStorage.setItem("appLanguage", langName);

    setShowLanguageModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#c084fc"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("myProfile")}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
              <Ionicons
                name="language"
                size={22}
                color="#ffffff"
                style={{ marginRight: 16 }}
              />
            </TouchableOpacity>
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
                  !imageError &&
                  user.profilePhoto &&
                  user.profilePhoto.startsWith("http")
                    ? {
                        uri: `${user.profilePhoto}?t=${new Date().getTime()}`,
                        cache: "reload",
                      }
                    : getPlaceholderImage(user.gender)
                }
                style={styles.profileImage}
                onError={(error) => {
                  if (user.profilePhoto) {
                    console.warn(
                      "Profile image failed to load:",
                      user.profilePhoto.substring(0, 100)
                    );
                  }
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
              />
              {user.role === "ServiceProvider" && (
                <View style={styles.kycBadgeWrapper}>
                  <Ionicons
                    name={
                      user.kycStatus === "verified"
                        ? "checkmark-circle"
                        : user.kycStatus === "pending" && user.kycSubmittedAt
                        ? "time"
                        : "alert-circle"
                    }
                    size={32}
                    color={
                      user.kycStatus === "verified"
                        ? "#3b82f6"
                        : user.kycStatus === "pending" && user.kycSubmittedAt
                        ? "#10b981"
                        : "#9ca3af"
                    }
                    style={styles.kycBadge}
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
                {user.address || t("addLocation")}
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>{t("personalDetails")}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="call" size={18} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("phoneNumber")}</Text>
                <Text style={styles.infoText}>
                  {user.phoneNumber || t("notProvided")}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="home" size={18} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("address")}</Text>
                <Text style={styles.infoText}>
                  {user.address || t("notProvided")}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="person" size={18} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("gender")}</Text>
                <Text style={styles.infoText}>
                  {user.gender || "NA"}, {user.age || "NA"} {t("years")}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Section */}
          <View style={styles.actionsContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>{t("quickActions")}</Text>
            </View>

            <View
              style={styles.actionButton}
              onTouchEnd={() => navigation.navigate("EditProfile")}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="pencil" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{t("editProfile")}</Text>
                <Text style={styles.actionDescription}>
                  {t("updatePersonalDetails")}
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
                  <Text style={styles.actionTitle}>{t("completeKYC")}</Text>
                  <Text style={styles.actionDescription}>
                    {t("verifyAccount")}
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
                <Text style={styles.actionTitle}>{t("settings")}</Text>
                <Text style={styles.actionDescription}>
                  {t("appPreferences")}
                </Text>
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
                  {t("logout")}
                </Text>
                <Text style={styles.actionDescription}>
                  {t("signOutAccount")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <BottomTab />
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.languageModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("selectLanguage")}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  i18n.language === lang.code && styles.selectedLanguageOption,
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <View style={styles.languageContent}>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageIcon}>{lang.icon}</Text>
                    <View>
                      <Text
                        style={[
                          styles.languageText,
                          i18n.language === lang.code &&
                            styles.selectedLanguageText,
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                      <Text style={styles.languageSubtext}>{lang.name}</Text>
                    </View>
                  </View>
                  {i18n.language === lang.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#8b5cf6"
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },

  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  languageModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  languageOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 10,
  },
  selectedLanguageOption: {
    backgroundColor: "#ede9fe",
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  languageContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageIcon: {
    fontSize: 32,
  },
  languageText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#475569",
  },
  languageSubtext: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  selectedLanguageText: {
    color: "#8b5cf6",
    fontWeight: "700",
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

  // KYC Badge Styles - Identity document submission badge
  kycBadgeWrapper: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  kycBadge: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Legacy styles removed
  gradient: {},
  actionCard: {},
  actionRow: {},
  actionText: {},
  verifiedInner: {},
});
