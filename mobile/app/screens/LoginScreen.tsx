import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Snackbar from "../../components/Snackbar";
import { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props): any {
  const [phone, setPhone] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [role, setRole] = useState<"user" | "provider" | null>(null);
  const [needsRole, setNeedsRole] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputs = useRef<Array<TextInput | null>>([]);
  const [cooldown, setCooldown] = useState(0);
  const [focusedInput, setFocusedInput] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const COUNTRY_FLAG = "🇮🇳";
  const COUNTRY_CODE = "91";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (cooldown > 0) {
      t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [cooldown]);

  // Real-time phone validation
  const handlePhoneChange = (text: string) => {
    setPhone(text.replace(/[^0-9]/g, "")); // allow only digits
    if (text.length > 0 && text.length < 10) {
      setPhoneError("Phone number must be 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const sendOtp = async () => {
    if (phone.length !== 10) {
      setPhoneError("Enter a valid 10-digit phone number");
      return;
    }
    setPhoneError("");
    setLoading(true);
    try {
      const resp = await api.post(`/auth/send-otp`, {
        phone: `+${COUNTRY_CODE}${phone}`,
      });
      let json = resp.data;
      if (json) {
        setStep("otp");
        setCooldown(60);
        setSnackbarMsg(
          `OTP sent to +${COUNTRY_CODE}${phone} - OTP is ${json.otp}`
        );
        // persist phone locally so EditProfile can read it after redirect
        try {
          await AsyncStorage.setItem("phoneNumber", `+${COUNTRY_CODE}${phone}`);
          console.log(
            "[login] saved phoneNumber to AsyncStorage:",
            `+${COUNTRY_CODE}${phone}`
          );
        } catch (e) {
          console.warn("Failed to save phone to AsyncStorage", e);
        }
      } else {
        setSnackbarMsg(json?.error || "Failed to send OTP");
      }
    } catch (e) {
      setSnackbarMsg("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    const enteredOtp = otp.join("");
    if (!enteredOtp || enteredOtp.length < 6) {
      return Alert.alert("Enter full OTP");
    }

    setLoading(true);
    try {
      const payload: any = {
        phone: `+${COUNTRY_CODE}${phone}`,
        otp: enteredOtp,
      };
      if (role) payload.role = role === "provider" ? "provider" : "user";

      const resp = await api.post(`/auth/verify-otp`, payload);
      const json = resp.data;
      if (resp.data) {
        if (json.token) {
          await AsyncStorage.setItem("token", json.token);
          if (json.user?.id)
            await AsyncStorage.setItem("userId", String(json.user.id));

          // persist phone locally as well
          try {
            await AsyncStorage.setItem(
              "phoneNumber",
              `+${COUNTRY_CODE}${phone}`
            );
            console.log(
              "[login] saved phoneNumber to AsyncStorage on verify:",
              `+${COUNTRY_CODE}${phone}`
            );
          } catch (e) {
            console.warn("Failed to save phone to AsyncStorage", e);
          }

          const serverRole = json.user?.role?.toLowerCase();
          if (serverRole) {
            await AsyncStorage.setItem(
              "userRole",
              serverRole.includes("provider") ? "serviceProvider" : "user"
            );
          } else if (role) {
            await AsyncStorage.setItem(
              "userRole",
              role === "provider" ? "serviceProvider" : "user"
            );
          }

          if (json.isNewUser) {
            navigation.reset({
              index: 0,
              routes: [{ name: "EditProfile", params: { needsRole: true } }],
            });
          } else {
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
          }
          return;
        }
        if (json.needsRole) {
          // Move role selection into the profile edit flow for a better UX.
          navigation.reset({
            index: 0,
            routes: [{ name: "EditProfile", params: { needsRole: true } }],
          });
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

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const digits = text.split("").slice(0, otp.length);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < otp.length) {
          newOtp[index + i] = d;
        }
      });
      setOtp(newOtp);
      const nextIndex = index + digits.length - 1;
      if (nextIndex < otp.length) otpInputs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < otp.length - 1) {
        otpInputs.current[index + 1]?.focus();
      } else if (!text && index > 0) {
        otpInputs.current[index - 1]?.focus();
      }
    }
  };

  const { height, width } = Dimensions.get("window");

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#6366f1", "#8b5cf6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require("../../assets/images/logo.png")}
                    style={styles.logo}
                  />
                </View>
                <Text style={styles.appName}>MyKaamwalibai</Text>
                <Text style={styles.tagline}>
                  Your trusted home service partner
                </Text>
              </View>

              {/* Welcome Text */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>
                  {step === "phone" ? "Welcome!" : "Verify OTP"}
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  {step === "phone"
                    ? "Enter your mobile number to continue"
                    : `Enter the code sent to +${COUNTRY_CODE} ${phone}`}
                </Text>
              </View>

              {step === "phone" ? (
                <>
                  {/* Phone Input */}
                  <View style={styles.inputWrapper}>
                    <View
                      style={[
                        styles.phoneContainer,
                        focusedInput === 0 && styles.inputFocused,
                        phoneError && styles.inputError,
                      ]}
                    >
                      <Text style={styles.countryCode}>🇮🇳 +{COUNTRY_CODE}</Text>
                      <View style={styles.separator} />
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Enter mobile number"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={handlePhoneChange}
                        maxLength={10}
                        onFocus={() => setFocusedInput(0)}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                    {phoneError ? (
                      <Text style={styles.errorText}>⚠️ {phoneError}</Text>
                    ) : null}
                  </View>

                  {/* Send OTP Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (loading || phone.length !== 10) && styles.buttonDisabled,
                    ]}
                    onPress={sendOtp}
                    disabled={loading || phone.length !== 10}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* OTP Input */}
                  <View style={styles.otpWrapper}>
                    <View style={styles.otpContainer}>
                      {otp.map((digit, index) => (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            focusedInput === index + 1 && styles.otpBoxFocused,
                            digit && styles.otpBoxFilled,
                          ]}
                        >
                          <TextInput
                            ref={(ref) => {
                              otpInputs.current[index] = ref;
                            }}
                            style={styles.otpInput}
                            value={digit}
                            onChangeText={(text) =>
                              handleOtpChange(text, index)
                            }
                            maxLength={1}
                            keyboardType="number-pad"
                            onFocus={() => setFocusedInput(index + 1)}
                            onBlur={() => setFocusedInput(null)}
                          />
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (loading || otp.join("").length !== 6) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={verify}
                    disabled={loading || otp.join("").length !== 6}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Verify & Continue
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Role Selection */}
                  {needsRole && (
                    <View style={styles.roleSection}>
                      <Text style={styles.roleTitle}>Select Account Type</Text>
                      <View style={styles.roleOptions}>
                        <TouchableOpacity
                          style={[
                            styles.roleCard,
                            role === "user" && styles.roleCardActive,
                          ]}
                          onPress={() => setRole("user")}
                        >
                          <Text style={styles.roleIcon}>👤</Text>
                          <Text
                            style={[
                              styles.roleLabel,
                              role === "user" && styles.roleLabelActive,
                            ]}
                          >
                            User
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.roleCard,
                            role === "provider" && styles.roleCardActive,
                          ]}
                          onPress={() => setRole("provider")}
                        >
                          <Text style={styles.roleIcon}>🛠️</Text>
                          <Text
                            style={[
                              styles.roleLabel,
                              role === "provider" && styles.roleLabelActive,
                            ]}
                          >
                            Service Provider
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Action Links */}
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => setStep("phone")}>
                      <Text style={styles.linkText}>Change Number</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionDivider}>•</Text>
                    <TouchableOpacity onPress={sendOtp} disabled={cooldown > 0}>
                      <Text
                        style={[
                          styles.linkText,
                          cooldown > 0 && styles.linkDisabled,
                        ]}
                      >
                        {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend OTP"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By continuing, you agree to our{" "}
                  <Text style={styles.footerLink}>Terms</Text> &{" "}
                  <Text style={styles.footerLink}>Privacy Policy</Text>
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        <Snackbar
          message={snackbarMsg}
          onDismiss={() => setSnackbarMsg(null)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 60,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  welcomeSection: {
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    height: 56,
  },
  inputFocused: {
    borderColor: "#6366f1",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    marginTop: 8,
    marginLeft: 4,
  },
  otpWrapper: {
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  otpBoxFocused: {
    borderColor: "#6366f1",
    backgroundColor: "#ffffff",
  },
  otpBoxFilled: {
    borderColor: "#6366f1",
    backgroundColor: "#f0f4ff",
  },
  otpInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  roleSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 12,
    textAlign: "center",
  },
  roleOptions: {
    flexDirection: "row",
    gap: 12,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  roleCardActive: {
    borderColor: "#6366f1",
    backgroundColor: "#f0f4ff",
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  roleLabelActive: {
    color: "#6366f1",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  actionDivider: {
    fontSize: 14,
    color: "#cbd5e1",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
  linkDisabled: {
    color: "#94a3b8",
  },
  footer: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  footerText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: "#6366f1",
    fontWeight: "600",
  },
});
