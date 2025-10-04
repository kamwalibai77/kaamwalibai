import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";
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
      {/* ✅ Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 🔙 Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>

        {/* 🔷 Page Title */}
        <Text style={styles.title}>Settings</Text>

        {/* ⭐ Reviews & Ratings */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate("ReveiwForm")}
        >
          <Ionicons name="star" size={22} color="#333" />
          <Text style={styles.optionText}>Reviews & Ratings</Text>
        </TouchableOpacity>

        {/* 🛡 Privacy Policy */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate("PrivacyPolicy")}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color="#333" />
          <Text style={styles.optionText}>Privacy & Policy</Text>
        </TouchableOpacity>

        {/* ℹ️ About Us */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate("Aboutus")}
        >
          <Ionicons name="information-circle-outline" size={22} color="#333" />
          <Text style={styles.optionText}>About Us</Text>
        </TouchableOpacity>

        {/* 🗑 Delete Account */}
        <TouchableOpacity
          style={[styles.option, { backgroundColor: "#ffe6e6" }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash" size={22} color="red" />
          <Text style={[styles.optionText, { color: "red" }]}>
            Delete Account
          </Text>
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
                <Text style={styles.confirmText}>
                  Are you sure you want to delete this account?
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: "#ef4444" }]}
                    onPress={() => {
                      deleteAccount();
                      navigation.replace("Login");
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
      </ScrollView>

      {/* 🔻 Bottom Tab (consistent with Home/Chat/Profile) */}
      <BottomTab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100, // space for bottom tab
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563eb",
    textAlign: "center",
    marginVertical: 40,
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
