import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";
import { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  const deleteAccount = async () => {
    try {
      await api.delete("profile");
      Alert.alert("Success", "Profile deleted successfully!");
    } catch (e) {
      console.error("Profile delete failed:", e);
      Alert.alert("Error", "Failed to delete profile");
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === "web") {
      setConfirmVisible(true);
    } else {
      Alert.alert(
        "Delete Account",
        "Are you sure you want to delete your account? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, Delete",
            style: "destructive",
            onPress: () => {
              deleteAccount();
              navigation.replace("Login");
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* Gradient Header */}
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#c084fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        {/* ✅ Scrollable content */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* ⭐ Reviews & Ratings */}
          <TouchableOpacity
            style={styles.option}
            onPress={() =>
              navigation.navigate("ReveiwForm", {
                isAppReview: true,
                providerName: "Application",
              })
            }
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="star" size={22} color="#f59e0b" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Reviews & Ratings</Text>
              <Text style={styles.optionSubText}>Share your feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* 🛡 Privacy Policy */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("PrivacyPolicy")}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#dbeafe" }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#3b82f6"
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Privacy & Policy</Text>
              <Text style={styles.optionSubText}>Read our privacy policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* ℹ️ About Us */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("Aboutus")}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#8b5cf6"
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>About Us</Text>
              <Text style={styles.optionSubText}>Learn about our app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* ❓ FAQ */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("FAQ")}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="help-circle-outline" size={22} color="#10b981" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>FAQ</Text>
              <Text style={styles.optionSubText}>
                Frequently asked questions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* 🗑 Delete Account */}
          <TouchableOpacity
            style={[styles.option, styles.deleteOption]}
            onPress={handleDeleteAccount}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="trash" size={22} color="#ef4444" />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: "#ef4444" }]}>
                Delete Account
              </Text>
              <Text style={[styles.optionSubText, { color: "#f87171" }]}>
                Permanently remove your account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>

          {/* ✅ Web-only confirmation modal */}
          {Platform.OS === "web" && (
            <Modal
              visible={confirmVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setConfirmVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.confirmBox}>
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: "#fee2e2", marginBottom: 16 },
                    ]}
                  >
                    <Ionicons name="warning" size={32} color="#ef4444" />
                  </View>
                  <Text style={styles.confirmTitle}>Delete Account?</Text>
                  <Text style={styles.confirmText}>
                    Are you sure you want to delete your account? This action
                    cannot be undone.
                  </Text>
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={[styles.confirmBtn, styles.confirmBtnCancel]}
                      onPress={() => setConfirmVisible(false)}
                    >
                      <Text style={styles.confirmBtnTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmBtn, styles.confirmBtnDelete]}
                      onPress={() => {
                        deleteAccount();
                        navigation.replace("Login");
                      }}
                    >
                      <Text style={styles.confirmBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>

        {/* 🔻 Bottom Tab (consistent with Home/Chat/Profile) */}
        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: "#f8fafc",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  deleteOption: {
    borderWidth: 1.5,
    borderColor: "#fee2e2",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  optionSubText: {
    fontSize: 13,
    color: "#64748b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmBox: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnCancel: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  confirmBtnDelete: {
    backgroundColor: "#ef4444",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  confirmBtnTextCancel: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 15,
  },
});
