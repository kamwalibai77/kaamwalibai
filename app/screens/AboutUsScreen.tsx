import { Ionicons } from "@expo/vector-icons";
import React from "react";
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
      {/* 🔙 Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Ionicons
          name="people-circle-outline"
          size={28}
          color="#fff"
          style={{ marginLeft: 8 }}
        />
        <Text style={styles.headerText}>About Us</Text>
      </View>

      {/* 🧾 Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.section}>
          <Text style={styles.title}>Welcome to Kamwali Bai</Text>
          <Text style={styles.text}>
            At <Text style={styles.bold}>Kamwali Bai</Text>, we believe that
            every household deserves reliable and professional home support. We
            are building a platform dedicated to connecting people with skilled
            and trustworthy home maids across India.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Ionicons name="flag-outline" size={22} color="#075e54" />
          <Text style={styles.title}>Our Mission</Text>
          <Text style={styles.text}>
            Our mission is simple:{" "}
            <Text style={styles.bold}>
              to reach out across India and provide quality manpower to the C2C
              (Customer-to-Customer) domain
            </Text>
            . Whether you need full-time help, part-time support, or specialized
            household assistance, Kamwali Bai is here to make your life easier.
          </Text>
        </View>

        {/* What We Do */}
        <View style={styles.section}>
          <Ionicons name="briefcase-outline" size={22} color="#075e54" />
          <Text style={styles.title}>What We Do</Text>
          <Text style={styles.text}>
            • Provide skilled and verified home maids.
          </Text>
          <Text style={styles.text}>
            • Empower domestic workers with stable employment.
          </Text>
          <Text style={styles.text}>
            • Ensure safe, transparent, and hassle-free hiring.
          </Text>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Ionicons name="people-outline" size={22} color="#075e54" />
          <Text style={styles.title}>Our Team</Text>
          <Text style={styles.text}>
            👨‍💻 Mohit Pote – Team Lead, Development
          </Text>
          <Text style={styles.text}>
            🛠️ Abhijeet Kuttarmare – Head of Quality & Business Administration
          </Text>
          <Text style={styles.text}>
            💼 Amit Kuttarmare – Head of Business Consulting
          </Text>
        </View>

        {/* Office */}
        <View style={styles.section}>
          <Ionicons name="location-outline" size={22} color="#075e54" />
          <Text style={styles.title}>Our Office</Text>
          <Text style={styles.text}>
            Vijayshailya Complex, First Floor, {"\n"}Trimurti Nagar, Nagpur,
            Maharashtra – 440022
          </Text>
        </View>
      </ScrollView>

      {/* 🔻 Bottom Tab */}
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#075e54",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 5,
  },
  section: {
    backgroundColor: "white",
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#075e54",
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "bold",
  },
});
