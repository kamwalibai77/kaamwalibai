import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

type Props = {
  state?: any;
};

export default function Breadcrumbs({ state }: Props) {
  // Breadcrumbs are optional. Only render when the navigation state is provided.
  if (!state || !Array.isArray(state.routes) || state.routes.length === 0)
    return null;

  try {
    const index =
      typeof state.index === "number" ? state.index : state.routes.length - 1;
    const segments = state.routes
      .slice(0, index + 1)
      .map((r: any) => (typeof r?.name === "string" ? r.name : ""))
      .filter(Boolean);
    const path = segments.join(" / ");

    if (!path) return null;

    return (
      <View style={styles.container} pointerEvents="none">
        <Text style={styles.text}>{path}</Text>
      </View>
    );
  } catch (_) {
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 1000,
  },
  text: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
});
