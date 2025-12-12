import { Platform, StyleSheet } from "react-native";

type Props = {
  state?: any;
};

export default function Breadcrumbs({ state }: Props) {
  // Breadcrumbs disabled - custom headers handle navigation
  return null;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 12,
    left: 12,
    right: 12,
    // backgroundColor: "rgba(255,255,255,0.9)",
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
  backBtn: {
    position: "absolute",
    left: 8,
    top: Platform.OS === "ios" ? 8 : 6,
    padding: 6,
  },
  text: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
});
