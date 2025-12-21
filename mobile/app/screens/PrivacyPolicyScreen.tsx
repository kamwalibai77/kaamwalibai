import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";

export default function PrivacyPolicyScreen({ navigation }: any) {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
          </View>
        </LinearGradient>

        {/* 📝 Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Your Privacy Matters</Text>
            <Text style={styles.introText}>
              At <Text style={styles.bold}>Kamwali Bai</Text>, we respect your
              privacy and are committed to protecting your personal data. This
              Privacy Policy explains how we collect, use, and safeguard your
              information when you use our app and services.
            </Text>
          </View>

          {/* Data Collection */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="document-text" size={24} color="#3b82f6" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Information We Collect</Text>
              <Text style={styles.listItem}>
                • Personal details (name, phone, address)
              </Text>
              <Text style={styles.listItem}>
                • Identity proofs (Aadhar, PAN, if provided)
              </Text>
              <Text style={styles.listItem}>
                • Service preferences and feedback
              </Text>
              <Text style={styles.listItem}>
                • Basic device information for app performance
              </Text>
            </View>
          </View>

          {/* Data Usage */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="lock-closed" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>How We Use Your Data</Text>
              <Text style={styles.listItem}>
                • To provide reliable maid services
              </Text>
              <Text style={styles.listItem}>
                • To verify and match service providers
              </Text>
              <Text style={styles.listItem}>
                • To improve user experience and app performance
              </Text>
              <Text style={styles.listItem}>
                • To communicate important updates or offers
              </Text>
            </View>
          </View>

          {/* Data Sharing */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="people" size={24} color="#f59e0b" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Data Sharing</Text>
              <Text style={styles.text}>
                We <Text style={styles.bold}>do not sell or rent</Text> your
                personal data. Information is only shared with:
              </Text>
              <Text style={styles.listItem}>
                • Registered service providers to fulfill your request
              </Text>
              <Text style={styles.listItem}>
                • Legal authorities, if required by law
              </Text>
            </View>
          </View>

          {/* Data Security */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="shield" size={24} color="#10b981" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Data Security</Text>
              <Text style={styles.text}>
                We use strict security measures to safeguard your data against
                unauthorized access, misuse, or disclosure. However, no method
                of transmission is 100% secure, and we encourage safe usage
                practices.
              </Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="mail" size={24} color="#ef4444" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <Text style={styles.text}>
                If you have any questions about this Privacy Policy, please
                contact us at:
              </Text>
              <View style={styles.contactItem}>
                <Ionicons name="location" size={18} color="#8b5cf6" />
                <Text style={styles.contactText}>
                  Vijayshailya Complex, First Floor, {"\n"}Trimurti Nagar,
                  Nagpur, Maharashtra – 440022
                </Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="call" size={18} color="#8b5cf6" />
                <Text style={styles.contactText}>+91-XXXXXXXXXX</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={18} color="#8b5cf6" />
                <Text style={styles.contactText}>support@kamwalibai.in</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 🔻 Bottom Tab */}
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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    paddingBottom: 120,
    paddingTop: 8,
    backgroundColor: "#f8fafc",
  },
  introSection: {
    backgroundColor: "#fff",
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#8b5cf6",
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
  },
  section: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 6,
    paddingLeft: 8,
  },
  bold: {
    fontWeight: "700",
    color: "#1e293b",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    gap: 10,
  },
  contactText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    flex: 1,
  },
});
