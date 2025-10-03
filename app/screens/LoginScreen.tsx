import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../utills/config";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "provider" | null>(null);
  const [needsRole, setNeedsRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    let t: any = null;
    if (cooldown > 0) {
      t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    if (!phone || phone.length < 6) return Alert.alert("Enter valid phone");
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await resp.json();
      if (resp.ok) {
        setRole(null);
        setNeedsRole(false);
        setStep("otp");
        setCooldown(60);
        Alert.alert("OTP sent", `OTP sent to ${phone}`);
      } else {
        Alert.alert("Error", json?.error || "Failed to send OTP");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!otp || otp.length < 4) return Alert.alert("Enter OTP");
    setLoading(true);
    try {
      const payload: any = { phone, otp };
      if (role) payload.role = role === "provider" ? "provider" : "user";

      const resp = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      if (resp.ok && json) {
        if (json.token) {
          await AsyncStorage.setItem("token", json.token);
          if (json.user?.id) {
            await AsyncStorage.setItem("userId", String(json.user.id));
          }
          if (json.user?.role) {
            await AsyncStorage.setItem(
              "userRole",
              json.user.role === "ServiceProvider" ? "serviceProvider" : "user"
            );
          } else if (role) {
            await AsyncStorage.setItem(
              "userRole",
              role === "provider" ? "serviceProvider" : "user"
            );
          }

          if (json.isNewUser) {
            navigation.reset({ index: 0, routes: [{ name: "EditProfile" }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
          }
          return;
        }

        if (json.needsRole) {
          setNeedsRole(true);
          return;
        }
      }

      Alert.alert("Error", json?.error || "Verification failed");
    } catch (e) {
      Alert.alert("Error", "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome 👋</Text>
        <Text style={styles.subtitle}>Sign in / Sign up with mobile</Text>

        {step === "phone" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={sendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={verify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            {needsRole && (
              <View
                style={{ marginTop: 20, width: "100%", alignItems: "center" }}
              >
                <Text style={{ marginBottom: 12, color: "#333", fontSize: 16 }}>
                  Sign up as
                </Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      role === "user" && styles.roleActive,
                    ]}
                    onPress={() => setRole("user")}
                  >
                    <Text
                      style={
                        role === "user"
                          ? styles.roleTextActive
                          : styles.roleText
                      }
                    >
                      User
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      role === "provider" && styles.roleActive,
                    ]}
                    onPress={() => setRole("provider")}
                  >
                    <Text
                      style={
                        role === "provider"
                          ? styles.roleTextActive
                          : styles.roleText
                      }
                    >
                      Service Provider
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.button, { marginTop: 12 }]}
                  onPress={verify}
                  disabled={loading || !role}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ marginTop: 16, alignItems: "center" }}>
              <TouchableOpacity onPress={() => setStep("phone")}>
                <Text style={styles.link}>Change phone number</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sendOtp}
                disabled={cooldown > 0}
                style={{ marginTop: 8 }}
              >
                <Text style={styles.link}>
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6", // soft gray bg
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  button: {
    width: "100%",
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  roleRow: { flexDirection: "row", marginTop: 10 },
  roleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginHorizontal: 6,
    borderRadius: 8,
  },
  roleActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  roleText: { color: "#374151", fontWeight: "500" },
  roleTextActive: { color: "#fff", fontWeight: "600" },
  link: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "500",
  },
});
// Other styles from different files for reference
