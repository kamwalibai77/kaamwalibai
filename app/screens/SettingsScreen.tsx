import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen({ navigation: navigation }: any) {
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: () => {
            // 🔥 Call API here to delete account
            console.log("Account deleted");
            // After deletion → logout or navigate to login
            navigation.replace("LoginScreen");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Reviews & Ratings */}
      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("ReviewsScreen")}
      >
        <Ionicons name="star" size={22} color="#333" />
        <Text style={styles.optionText}>Reviews & Ratings</Text>
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
    </View>
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
});
