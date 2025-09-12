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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "ServiceProvider">("user");

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      debugger;
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Registration successful:", data);
        await AsyncStorage.setItem("userRole", data.role);
        await AsyncStorage.setItem("userId", String(data.id));

        // ✅ Redirect to ProfileScreen
        router.navigate("/screens/ProfileScreen");
      } else {
        Alert.alert("Error", data.error || "Registration failed");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      Alert.alert("Error", "Network error");
    }
  };

  return (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={styles.gradient}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[styles.card, isMobile ? styles.cardMobile : styles.cardWeb]}
        >
          <Image
            source={require("../../assets/images/logo.jpeg")}
            style={[styles.logo, isMobile && { width: 80, height: 80 }]}
            resizeMode="contain"
          />
          <Text style={[styles.title, isMobile && { fontSize: 28 }]}>
            Create Your Account
          </Text>
          <Text style={[styles.subtitle, isMobile && { fontSize: 14 }]}>
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
              style={[styles.input, isMobile && { fontSize: 14, height: 40 }]}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#a5b4fc"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={22}
              color="#6366f1"
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, isMobile && { fontSize: 14, height: 40 }]}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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
              style={[styles.input, isMobile && { fontSize: 14, height: 40 }]}
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
                I am User
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
                I am Service Provider
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
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
          <TouchableOpacity onPress={() => router.push("/screens/LoginScreen")}>
            <Text style={[styles.registerText, isMobile && { fontSize: 14 }]}>
              Already have an account?{" "}
              <Text style={{ color: "#6366f1", fontWeight: "bold" }}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  cardMobile: { width: "90%", padding: 24, minHeight: 500 },
  logo: { width: 120, height: 120, marginBottom: 30 },
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
});
