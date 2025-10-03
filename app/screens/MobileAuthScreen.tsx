import React, { useState } from "react";
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

export default function MobileAuthScreen({ navigation }: any) {
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
        // reset any previous role state and show otp step
        setRole(null);
        setNeedsRole(false);
        setStep("otp");
        setCooldown(60); // 60 seconds cooldown for resend
        Alert.alert(
          "OTP sent",
          `OTP sent to ${phone} (dev: check server logs)`
        );
      } else {
        Alert.alert(
          "Error",
          json && json.error ? json.error : "Failed to send OTP"
        );
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
          if (json.user && json.user.id) {
            await AsyncStorage.setItem("userId", String(json.user.id));
          }
          // set stored role based on created/found user
          if (json.user && json.user.role) {
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

          // If a new user was created, send them to EditProfile so they can complete details
          if (json.isNewUser) {
            navigation.reset({ index: 0, routes: [{ name: "EditProfile" }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
          }
          return;
        }

        if (json.needsRole) {
          // server indicates the phone has no user and role must be provided to create account
          setNeedsRole(true);
          // keep on the OTP step and let user pick role and continue
          return;
        }
      }

      Alert.alert(
        "Error",
        json && json.error ? json.error : "Verification failed"
      );
    } catch (e) {
      Alert.alert("Error", "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in / Sign up</Text>
      {step === "phone" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Mobile number"
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
          {/** If server indicates a role is required for signup, show selector here */}
          {needsRole && (
            <View
              style={{ marginTop: 12, alignItems: "center", width: "100%" }}
            >
              <Text style={{ marginBottom: 8, color: "#333" }}>
                Are you signing up as?
              </Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === "user" && styles.roleActive]}
                  onPress={() => setRole("user")}
                >
                  <Text
                    style={
                      role === "user" ? styles.roleTextActive : styles.roleText
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
          <View style={{ marginTop: 12, alignItems: "center" }}>
            <TouchableOpacity onPress={() => setStep("phone")}>
              <Text style={{ color: "#666" }}>Change phone number</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={sendOtp}
              disabled={cooldown > 0}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: cooldown > 0 ? "#999" : "#4f46e5" }}>
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    width: "100%",
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  roleRow: { flexDirection: "row", marginBottom: 12 },
  roleBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 8,
    borderRadius: 6,
  },
  roleActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  roleText: { color: "#333" },
  roleTextActive: { color: "#fff" },
});
