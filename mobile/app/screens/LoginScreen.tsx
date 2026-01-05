import { Ionicons } from "@expo/vector-icons";
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
      console.log("📤 Sending OTP request for:", `+${COUNTRY_CODE}${phone}`);
      const resp = await api.post(`/auth/send-otp`, {
        phone: `+${COUNTRY_CODE}${phone}`,
      });
      console.log("✅ OTP response received:", resp.status);
      let json = resp.data;
      if (json) {
        setStep("otp");
        setCooldown(60);
        // ❌ SECURITY: Never display OTP on screen
        // OTP is sent via SMS or can be viewed in backend console logs for testing
        setSnackbarMsg(`OTP sent to +${COUNTRY_CODE}${phone}`);
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
    } catch (e: any) {
      console.error("❌ OTP send error:", e?.message);
      console.error("Error details:", {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
      });

      // Check if it's a rate limit error
      if (e?.response?.status === 429) {
        const errorMsg =
          e?.response?.data?.error ||
          "Too many requests. Please wait and try again.";
        setSnackbarMsg(errorMsg);
      } else if (e?.message === "Network Error") {
        setSnackbarMsg(
          "Network error. Please check your connection and try again."
        );
      } else {
        setSnackbarMsg(
          e?.response?.data?.error || "Failed to send OTP. Please try again."
        );
      }
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
        {/* Animated Background Gradient */}
        <LinearGradient
          colors={["#667eea", "#764ba2", "#f093fb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        {/* Decorative Circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

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
              {/* Logo Section with Glass Effect */}
              <View style={styles.logoSection}>
                <LinearGradient
                  colors={["#ffffff", "#f8f9ff"]}
                  style={styles.logoCircle}
                >
                  <View style={styles.logoInner}>
                    <Image
                      source={require("../../assets/images/logo.png")}
                      style={styles.logo}
                    />
                  </View>
                </LinearGradient>
                <Text style={styles.appName}>MyKaamwalibai</Text>
                <View style={styles.taglineContainer}>
                  <Ionicons name="star" size={12} color="#fbbf24" />
                  <Text style={styles.tagline}>
                    Your trusted home service partner
                  </Text>
                  <Ionicons name="star" size={12} color="#fbbf24" />
                </View>
              </View>

              {/* Welcome Text */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>
                  {step === "phone" ? "Welcome" : "Verify OTP"}
                </Text>
                {step === "otp" && (
                  <Text style={styles.welcomeSubtitle}>
                    {`We've sent a verification code to\n+${COUNTRY_CODE} ${phone}`}
                  </Text>
                )}
              </View>

              {step === "phone" ? (
                <>
                  {/* Phone Input with Enhanced Design */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>
                      <Ionicons name="call-outline" size={14} color="#64748b" />{" "}
                      • Mobile Number
                    </Text>
                    <View
                      style={[
                        styles.phoneContainer,
                        focusedInput === 0 && styles.inputFocused,
                        phoneError && styles.inputError,
                      ]}
                    >
                      <View style={styles.countryCodeWrapper}>
                        <Text style={styles.flag}>🇮🇳</Text>
                        <Text style={styles.countryCode}>+{COUNTRY_CODE}</Text>
                      </View>
                      <View style={styles.separator} />
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Enter 10 digit number"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={handlePhoneChange}
                        maxLength={10}
                        onFocus={() => setFocusedInput(0)}
                        onBlur={() => setFocusedInput(null)}
                      />
                      {phone.length === 10 && !phoneError && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#10b981"
                        />
                      )}
                    </View>
                    {phoneError ? (
                      <View style={styles.errorContainer}>
                        <Ionicons
                          name="alert-circle"
                          size={14}
                          color="#ef4444"
                        />
                        <Text style={styles.errorText}>{phoneError}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Send OTP Button with Gradient */}
                  <TouchableOpacity
                    style={[
                      styles.primaryButtonWrapper,
                      (loading || phone.length !== 10) &&
                        styles.buttonDisabledWrapper,
                    ]}
                    onPress={sendOtp}
                    disabled={loading || phone.length !== 10}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        loading || phone.length !== 10
                          ? ["#cbd5e1", "#94a3b8"]
                          : ["#667eea", "#764ba2"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButton}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>Send OTP</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={20}
                            color="#fff"
                          />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Info Card */}
                  <View style={styles.infoCard}>
                    <Ionicons
                      name="information-circle"
                      size={18}
                      color="#667eea"
                    />
                    <Text style={styles.infoText}>
                      We'll send you a 6-digit verification code
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* OTP Input with Enhanced Design */}
                  <View style={styles.otpWrapper}>
                    <Text style={styles.inputLabel}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={14}
                        color="#64748b"
                      />{" "}
                      Enter Verification Code
                    </Text>
                    <View style={styles.otpContainer}>
                      {otp.map((digit, index) => (
                        <Animated.View
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
                          {digit && (
                            <View style={styles.otpCheckmark}>
                              <Ionicons
                                name="checkmark"
                                size={12}
                                color="#10b981"
                              />
                            </View>
                          )}
                        </Animated.View>
                      ))}
                    </View>
                  </View>

                  {/* Verify Button with Gradient */}
                  <TouchableOpacity
                    style={[
                      styles.primaryButtonWrapper,
                      (loading || otp.join("").length !== 6) &&
                        styles.buttonDisabledWrapper,
                    ]}
                    onPress={verify}
                    disabled={loading || otp.join("").length !== 6}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        loading || otp.join("").length !== 6
                          ? ["#cbd5e1", "#94a3b8"]
                          : ["#10b981", "#059669"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButton}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#fff"
                          />
                          <Text style={styles.primaryButtonText}>
                            Verify & Continue
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Role Selection with Enhanced Cards */}
                  {needsRole && (
                    <View style={styles.roleSection}>
                      <Text style={styles.roleTitle}>
                        <Ionicons name="people" size={16} color="#64748b" />{" "}
                        Select Account Type
                      </Text>
                      <View style={styles.roleOptions}>
                        <TouchableOpacity
                          style={[
                            styles.roleCard,
                            role === "user" && styles.roleCardActive,
                          ]}
                          onPress={() => setRole("user")}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={
                              role === "user"
                                ? ["#667eea", "#764ba2"]
                                : ["#f8fafc", "#f1f5f9"]
                            }
                            style={styles.roleGradient}
                          >
                            <View style={styles.roleIconCircle}>
                              <Text style={styles.roleIcon}>👤</Text>
                            </View>
                            <Text
                              style={[
                                styles.roleLabel,
                                role === "user" && styles.roleLabelActive,
                              ]}
                            >
                              User
                            </Text>
                            {role === "user" && (
                              <View style={styles.roleCheck}>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={18}
                                  color="#fff"
                                />
                              </View>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.roleCard,
                            role === "provider" && styles.roleCardActive,
                          ]}
                          onPress={() => setRole("provider")}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={
                              role === "provider"
                                ? ["#667eea", "#764ba2"]
                                : ["#f8fafc", "#f1f5f9"]
                            }
                            style={styles.roleGradient}
                          >
                            <View style={styles.roleIconCircle}>
                              <Text style={styles.roleIcon}>🛠️</Text>
                            </View>
                            <Text
                              style={[
                                styles.roleLabel,
                                role === "provider" && styles.roleLabelActive,
                              ]}
                            >
                              Service Provider
                            </Text>
                            {role === "provider" && (
                              <View style={styles.roleCheck}>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={18}
                                  color="#fff"
                                />
                              </View>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Action Links with Enhanced Style */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => setStep("phone")}
                      style={styles.actionButton}
                    >
                      <Ionicons
                        name="arrow-back-circle"
                        size={16}
                        color="#667eea"
                      />
                      <Text style={styles.linkText}>Change Number</Text>
                    </TouchableOpacity>
                    <View style={styles.actionDivider} />
                    <TouchableOpacity
                      onPress={sendOtp}
                      disabled={cooldown > 0}
                      style={styles.actionButton}
                    >
                      <Ionicons
                        name="refresh-circle"
                        size={16}
                        color={cooldown > 0 ? "#94a3b8" : "#667eea"}
                      />
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

              {/* Footer with Better Design */}
              <View style={styles.footer}>
                <View style={styles.footerDivider} />
                <View style={styles.secureContainer}>
                  <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                  <Text style={styles.secureText}>Secure & Encrypted</Text>
                </View>
                <Text style={styles.footerText}>
                  By continuing, you agree to our{" "}
                  <Text style={styles.footerLink}>Terms of Service</Text> and{" "}
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
    backgroundColor: "#0f172a",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    bottom: -50,
    left: -50,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 32,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 65,
    height: 65,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagline: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  welcomeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  welcomeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 22,
    marginLeft: 46,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 10,
    marginLeft: 4,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 18,
    backgroundColor: "#f8fafc",
    height: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputFocused: {
    borderColor: "#667eea",
    backgroundColor: "#ffffff",
    shadowColor: "#667eea",
    shadowOpacity: 0.15,
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  countryCodeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  separator: {
    width: 2,
    height: 28,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 14,
    borderRadius: 1,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 4,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "500",
  },
  otpWrapper: {
    marginBottom: 28,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxFocused: {
    borderColor: "#667eea",
    backgroundColor: "#ffffff",
    borderWidth: 2.5,
    shadowColor: "#667eea",
    shadowOpacity: 0.2,
  },
  otpBoxFilled: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    width: "100%",
  },
  otpCheckmark: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 2,
  },
  primaryButtonWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabledWrapper: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButton: {
    height: 60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  infoText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
    flex: 1,
  },
  roleSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 16,
    textAlign: "center",
  },
  roleOptions: {
    flexDirection: "row",
    gap: 12,
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roleCardActive: {
    shadowColor: "#667eea",
    shadowOpacity: 0.3,
  },
  roleGradient: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  roleIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  roleIcon: {
    fontSize: 32,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  roleLabelActive: {
    color: "#ffffff",
  },
  roleCheck: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  linkDisabled: {
    color: "#94a3b8",
  },
  footer: {
    marginTop: 32,
  },
  footerDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 16,
  },
  secureContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  secureText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
  },
  footerText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: "#667eea",
    fontWeight: "700",
  },
});
