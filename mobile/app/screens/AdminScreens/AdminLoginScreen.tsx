import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminLoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Error", "Please enter phone number and password");
      return;
    }

    setLoading(true);

    try {
      // TODO: Add API call for admin login
      // For now, check if it's the super admin default number
      if (phone === "9999999999") {
        // Navigate to SuperAdmin dashboard
        navigation.replace("SuperAdminDashboard");
      } else {
        Alert.alert("Error", "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#a855f7"]}
          style={styles.headerGradient}
        >
          <Ionicons name="shield-checkmark" size={60} color="#ffffff" />
          <Text style={styles.heading}>Admin Portal</Text>
          <Text style={styles.subheading}>Secure Login</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.inputCard}>
            <View style={styles.labelRow}>
              <Ionicons name="call" size={18} color="#6366f1" />
              <Text style={styles.label}>Phone Number</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />
          </View>

          <View style={styles.inputCard}>
            <View style={styles.labelRow}>
              <Ionicons name="lock-closed" size={18} color="#6366f1" />
              <Text style={styles.label}>Password</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <LinearGradient
              colors={
                loading
                  ? ["#cbd5e1", "#94a3b8"]
                  : ["#6366f1", "#8b5cf6", "#a855f7"]
              }
              style={styles.loginButton}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Login</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  headerGradient: {
    padding: 40,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: "#e0e7ff",
    fontWeight: "500",
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  inputCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
