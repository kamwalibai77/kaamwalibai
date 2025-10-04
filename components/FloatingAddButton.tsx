import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function FloatingAddButton({
  onPress,
}: {
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: 16 + Math.max(0, insets.bottom) }]}
      onPress={() => {
        console.log("FloatingAddButton pressed (platform)");
        try {
          onPress();
        } catch (e) {
          console.warn("FloatingAddButton onPress error:", e);
        }
      }} // 👈 navigate to AddJob screen
    >
      <Ionicons name="add" size={28} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#6366f1",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
