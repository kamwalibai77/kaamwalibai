import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./../services/api";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!mounted) return;
        if (token) navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } catch (e) {
        // ignore and continue to show register
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigation]);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "ServiceProvider">("user");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // navigation will be passed as prop
  const { width } = useWindowDimensions();
  const isPhoneNumber = width < 600;

  const handleRegister = async () => {
    if (!name || !phoneNumber || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Error", "You must agree to the Terms & Conditions");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        name,
        phoneNumber,
        password,
        role,
      });
      const data = await response.data;

      // Normalize role to match app's canonical form (serviceProvider or user)
      const rawRole = (data.role || role || "user").toString();
      const compact = rawRole.replace(/[^a-zA-Z]/g, "").toLowerCase();
      const normalizedRole =
        compact === "serviceprovider" ? "serviceProvider" : "user";

      await AsyncStorage.setItem("token", String(data.token));
      await AsyncStorage.setItem("userRole", normalizedRole);
      await AsyncStorage.setItem("userId", String(data.id));

      // Reset navigation to Home so back button doesn't return to Register
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err: any) {
      alert("Error " + (err?.response?.data?.error || "Registration failed"));
    }
  };

  return (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={styles.gradient}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            isPhoneNumber ? styles.cardPhoneNumber : styles.cardWeb,
          ]}
        >
          <Image
            source={require("../../assets/images/logo.png")}
            style={[styles.logo, isPhoneNumber && { width: 80, height: 80 }]}
            resizeMode="contain"
          />
          <Text style={[styles.title, isPhoneNumber && { fontSize: 28 }]}>
            Welcome to कामवालीबाई
          </Text>
          <Text style={[styles.subtitle, isPhoneNumber && { fontSize: 14 }]}>
            Sign up as a User or Service Provider
          </Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={22}
              color="#6366f1"
              style={styles.icon}
            />
            <TextInput
              style={[
                styles.input,
                isPhoneNumber && { fontSize: 14, height: 40 },
              ]}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#a5b4fc"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={22}
              color="#6366f1"
              style={styles.icon}
            />
            <TextInput
              style={[
                styles.input,
                isPhoneNumber && { fontSize: 14, height: 40 },
              ]}
              placeholder="Contact Number"
              value={phoneNumber}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, "").slice(0, 10);
                setPhoneNumber(numericText);
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholderTextColor="#a5b4fc"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="#6366f1"
              style={styles.icon}
            />
            <TextInput
              style={[
                styles.input,
                isPhoneNumber && { fontSize: 14, height: 40 },
              ]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#a5b4fc"
            />
          </View>

          {/* Role Selection */}
          <Text style={styles.roleLabel}>Register as:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "user" && styles.roleSelected,
              ]}
              onPress={() => setRole("user")}
            >
              <Ionicons
                name="person-circle-outline"
                size={20}
                color={role === "user" ? "#fff" : "#6366f1"}
                style={{ marginBottom: 4 }}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  role === "user" && styles.roleButtonTextSelected,
                ]}
              >
                User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "ServiceProvider" && styles.roleSelected,
              ]}
              onPress={() => setRole("ServiceProvider")}
            >
              <Ionicons
                name="build-outline"
                size={20}
                color={role === "ServiceProvider" ? "#fff" : "#6366f1"}
                style={{ marginBottom: 4 }}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  role === "ServiceProvider" && styles.roleButtonTextSelected,
                ]}
              >
                Service Provider
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              {acceptedTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text style={styles.link} onPress={() => setShowTerms(true)}>
                Terms & Conditions
              </Text>
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.button, !acceptedTerms && { opacity: 0.5 }]}
            disabled={!acceptedTerms}
            onPress={handleRegister}
          >
            <LinearGradient
              colors={["#6366f1", "#4f46e5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.buttonText}>Register</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Redirect */}
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text
              style={[styles.registerText, isPhoneNumber && { fontSize: 14 }]}
            >
              Already have an account?{" "}
              <Text style={{ color: "#6366f1", fontWeight: "bold" }}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        onRequestClose={() => setShowTerms(false)}
      >
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalHeading}>Terms & Conditions</Text>
          <Text style={styles.modalText}>
            {/* Paste your Terms & Conditions text here */}
            Effective Date: 2-9-25 Welcome to Kaamwali Bai (“we”, “our”, “us”).
            By accessing or using our application (“App”), you agree to the
            following Terms & Conditions. Please read them carefully.{"\n\n"}
            1.Purpose of the App Kaamwali Bai is a service provider platform
            that connects users (“Clients”) with independent service providers
            (“Providers”). We only provide subscription-based access to the
            platform. We do not charge commissions on transactions between
            Clients and Providers.
            {"\n\n"}
            2.User Responsibilities Clients and Providers are solely responsible
            for their interactions, agreements, and transactions with each
            other. Kaamwali Bai is not a party to any agreement between Client
            and Provider. Any payments, refunds, or disputes related to services
            are handled directly between the involved parties
            {"\n\n"}
            3.. No Liability for Disputes Kaamwali Bai is not responsible for
            any: Payment issues or disputes between Clients and Providers.
            Service quality, delays, or non-performance. Damages, fraud, or
            misrepresentation by any party. All risks arising from interactions
            on the App remain with the respective users.
            {"\n\n"}
            4. Data & Privacy Kaamwali Bai does not sell, misuse, or share user
            data, contacts, or personal information. Data collected is used
            solely for account creation, verification, and App functionality. By
            using the App, you agree to our Privacy Policy.
            {"\n\n"}
            5. Subscriptions & Fees Users may be required to purchase a
            subscription to access certain features. All subscription fees are
            non-refundable, unless required by law. Kaamwali Bai reserves the
            right to change pricing with prior notice.
            {"\n\n"}
            6.Prohibited Activities Users must not: Use the App for unlawful,
            harmful, or fraudulent purposes. Misrepresent themselves or
            impersonate another person. Violate the rights of other users.
            {"\n\n"}
            7. Limitation of Liability Our role is limited to providing a
            platform for connecting Clients and Providers. Kaamwali Bai is not
            liable for any direct, indirect, incidental, or consequential
            damages arising from the use of the App
            {"\n\n"}
            8. Termination We reserve the right to suspend or terminate accounts
            that violate these Terms & Conditions. Upon termination, users lose
            access to subscription benefits
            {"\n\n"}
            9. Modifications We may update these Terms & Conditions from time to
            time. Continued use of the App after changes constitutes acceptance
            of the updated terms.
            {"\n\n"}
            10. Governing Law These Terms & Conditions shall be governed by and
            interpreted in accordance with the laws of [India /Maharashtra].
            (Include your full Terms here)
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowTerms(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    alignItems: "center",
  },
  cardWeb: { width: "60%", maxWidth: 800, minHeight: 650, padding: 50 },
  cardPhoneNumber: { width: "90%", padding: 24, minHeight: 500 },
  logo: { width: 180, height: 180, marginBottom: 30 },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    marginBottom: 18,
    paddingHorizontal: 16,
    width: "100%",
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 48, fontSize: 16, color: "#334155" },
  roleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#6366f1",
    alignItems: "center",
    marginHorizontal: 8,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  roleSelected: { backgroundColor: "#6366f1" },
  roleButtonText: { fontSize: 15, fontWeight: "600", color: "#6366f1" },
  roleButtonTextSelected: { color: "#fff", fontWeight: "700" },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    width: "100%",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#6366f1",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  termsText: { fontSize: 13, color: "#334155", flexShrink: 1 },
  link: { color: "#6366f1", fontWeight: "600" },
  button: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 20,
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  registerText: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
  },
  modalContent: { flex: 1, padding: 20, backgroundColor: "#fff" },
  modalHeading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: { fontSize: 14, color: "#334155", lineHeight: 22 },
  closeButton: {
    marginTop: 20,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },
  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
