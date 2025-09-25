import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomTab from "../../components/BottomTabs";
import api from "../services/api";

export default function SettingsScreen() {
  const router = useRouter();
  // Web-only confirmation modal
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleDeleteAccount = () => {
    if (Platform.OS === "web") {
      setConfirmVisible(true);
    } else {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this service?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteAccount(),
          },
        ]
      );
    }

    const deleteAccount = async () => {
      try {
        await api.delete("profile");
        Alert.alert("Success", "Profile deleted successfully!");
      } catch (e) {
        console.error("Profile delete failed:", e);
        Alert.alert("Error", "Failed to delete profile");
      }
    };

    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: () => {
            console.log("Account deleted");
            router.replace("/screens/LoginScreen"); // ✅ matches AppNavigator
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={styles.container}>
        {/* Reviews & Ratings */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/screens/ReviewFormScreen")} // 👈 only works if added in AppNavigator
        >
          <Ionicons name="star" size={22} color="#333" />
          <Text style={styles.optionText}>Reviews & Ratings</Text>
        </TouchableOpacity>

        {/* Privacy & Policy */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/screens/PrivacyPolicyScreen")} // ✅ exact match
        >
          <Ionicons name="shield-checkmark-outline" size={22} color="#333" />
          <Text style={styles.optionText}>Privacy & Policy</Text>
        </TouchableOpacity>

        {/* About Us */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/screens/AboutUsScreen")} // ✅ exact match
        >
          <Ionicons name="information-circle-outline" size={22} color="#333" />
          <Text style={styles.optionText}>About Us</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={[styles.option, { backgroundColor: "#ffe6e6" }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash" size={22} color="red" />
          <Text style={[styles.optionText, { color: "red" }]}>
            Delete Account
          </Text>
        </TouchableOpacity>
        {/* ✅ Web-only Delete Confirmation Modal */}
        {Platform.OS === "web" && (
          <Modal
            visible={confirmVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>
                  Are you sure you want to delete this service?
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: "#ef4444" }]}
                    onPress={() => {
                      deleteAccount();
                      router.replace("/screens/LoginScreen"); // ✅ matches AppNavigator
                    }}
                  >
                    <Text style={styles.confirmBtnText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: "#6b7280" }]}
                    onPress={() => setConfirmVisible(false)}
                  >
                    <Text style={styles.confirmBtnText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
      <BottomTab />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  confirmBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmBtn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
