import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupportMaintenanceDashboard({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#f59e0b", "#d97706", "#b45309"]}
        style={styles.headerGradient}
      >
        <Ionicons name="construct" size={40} color="#ffffff" />
        <Text style={styles.heading}>Support & Maintenance</Text>
        <Text style={styles.subheading}>Complaint Management</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Dashboard content will be added here */}
          <Text style={styles.placeholderText}>
            Support & Maintenance Dashboard - Coming Soon
          </Text>
          <Text style={styles.infoText}>
            Access to: View and update complaints, Change complaint status, and
            Complaint analytics
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerGradient: {
    padding: 24,
    alignItems: "center",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 12,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: "#fef3c7",
    textAlign: "center",
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginTop: 40,
  },
  infoText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
