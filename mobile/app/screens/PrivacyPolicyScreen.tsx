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

export default function PrivacyPolicyScreen({ navigation }: any) {
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
          name="shield-checkmark-outline"
          size={28}
          color="#fff"
          style={{ marginLeft: 8 }}
        />
        <Text style={styles.headerText}>Privacy & Policy</Text>
      </View>

      {/* 📝 Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.section}>
          <Text style={styles.title}>Your Privacy Matters</Text>
          <Text style={styles.text}>
            At <Text style={styles.bold}>Kamwali Bai</Text>, we respect your
            privacy and are committed to protecting your personal data. This
            Privacy Policy explains how we collect, use, and safeguard your
            information when you use our app and services.
          </Text>
        </View>

        {/* Data Collection */}
        <View style={styles.section}>
          <Ionicons name="document-text-outline" size={22} color="#075e54" />
          <Text style={styles.title}>Information We Collect</Text>
          <Text style={styles.text}>
            • Personal details (name, phone, address).
          </Text>
          <Text style={styles.text}>
            • Identity proofs (Aadhar, PAN, if provided).
          </Text>
          <Text style={styles.text}>• Service preferences and feedback.</Text>
          <Text style={styles.text}>
            • Basic device information for app performance.
          </Text>
        </View>

        {/* Data Usage */}
        <View style={styles.section}>
          <Ionicons name="lock-closed-outline" size={22} color="#075e54" />
          <Text style={styles.title}>How We Use Your Data</Text>
          <Text style={styles.text}>• To provide reliable maid services.</Text>
          <Text style={styles.text}>
            • To verify and match service providers.
          </Text>
          <Text style={styles.text}>
            • To improve user experience and app performance.
          </Text>
          <Text style={styles.text}>
            • To communicate important updates or offers.
          </Text>
        </View>

        {/* Data Sharing */}
        <View style={styles.section}>
          <Ionicons name="people-outline" size={22} color="#075e54" />
          <Text style={styles.title}>Data Sharing</Text>
          <Text style={styles.text}>
            We <Text style={styles.bold}>do not sell or rent</Text> your
            personal data. Information is only shared with:
          </Text>
          <Text style={styles.text}>
            • Verified service providers to fulfill your request.
          </Text>
          <Text style={styles.text}>
            • Legal authorities, if required by law.
          </Text>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Ionicons name="shield-outline" size={22} color="#075e54" />
          <Text style={styles.title}>Data Security</Text>
          <Text style={styles.text}>
            We use strict security measures to safeguard your data against
            unauthorized access, misuse, or disclosure. However, no method of
            transmission is 100% secure, and we encourage safe usage practices.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Ionicons name="mail-outline" size={22} color="#075e54" />
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions about this Privacy Policy, please contact
            us at:
          </Text>
          <Text style={styles.text}>
            📍 Vijayshailya Complex, First Floor, {"\n"}Trimurti Nagar, Nagpur,
            Maharashtra – 440022
          </Text>
          <Text style={styles.text}>📞 Phone: +91-XXXXXXXXXX</Text>
          <Text style={styles.text}>✉️ Email: support@kamwalibai.in</Text>
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
