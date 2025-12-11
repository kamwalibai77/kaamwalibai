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

export default function AboutUsScreen({ navigation }: any) {
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
          <Text style={styles.headerTitle}>About Us</Text>
          <View style={styles.headerIcon}>
            <Ionicons name="people-circle" size={24} color="#fff" />
          </View>
        </LinearGradient>

        {/* 🧾 Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Welcome to Kamwali Bai</Text>
            <Text style={styles.introText}>
              At <Text style={styles.bold}>Kamwali Bai</Text>, we believe that
              every household deserves reliable and professional home support.
              We are building a platform dedicated to connecting people with
              skilled and trustworthy home maids across India.
            </Text>
          </View>

          {/* Mission */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="flag" size={24} color="#f59e0b" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Our Mission</Text>
              <Text style={styles.text}>
                Our mission is simple:{" "}
                <Text style={styles.bold}>
                  to reach out across India and provide quality manpower to the
                  C2C (Customer-to-Customer) domain
                </Text>
                . Whether you need full-time help, part-time support, or
                specialized household assistance, Kamwali Bai is here to make
                your life easier.
              </Text>
            </View>
          </View>

          {/* What We Do */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="briefcase" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>What We Do</Text>
              <Text style={styles.listItem}>
                • Provide skilled and verified home maids
              </Text>
              <Text style={styles.listItem}>
                • Empower domestic workers with stable employment
              </Text>
              <Text style={styles.listItem}>
                • Ensure safe, transparent, and hassle-free hiring
              </Text>
            </View>
          </View>

          {/* Team */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="people" size={24} color="#3b82f6" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Our Team</Text>
              <View style={styles.teamMember}>
                <Ionicons name="laptop" size={18} color="#8b5cf6" />
                <Text style={styles.teamText}>
                  <Text style={styles.teamName}>Mohit Pote</Text>
                  {"\n"}Team Lead, Development
                </Text>
              </View>
              <View style={styles.teamMember}>
                <Ionicons name="construct" size={18} color="#8b5cf6" />
                <Text style={styles.teamText}>
                  <Text style={styles.teamName}>Abhijeet Kuttarmare</Text>
                  {"\n"}Head of Quality & Business Administration
                </Text>
              </View>
              <View style={styles.teamMember}>
                <Ionicons name="briefcase" size={18} color="#8b5cf6" />
                <Text style={styles.teamText}>
                  <Text style={styles.teamName}>Amit Kuttarmare</Text>
                  {"\n"}Head of Business Consulting
                </Text>
              </View>
            </View>
          </View>

          {/* Office */}
          <View style={styles.section}>
            <View style={[styles.iconWrapper, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="location" size={24} color="#ef4444" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Our Office</Text>
              <Text style={styles.text}>
                Vijayshailya Complex, First Floor, {"\n"}Trimurti Nagar, Nagpur,
                Maharashtra – 440022
              </Text>
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
  teamMember: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
  },
  teamText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    flex: 1,
  },
  teamName: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: 15,
  },
});
