import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../utills/config";

const { width } = Dimensions.get("window");

export default function KYCVerification(): any {
  const navigation: any = useNavigation();
  const [aadhaar, setAadhaar] = useState<string>("");
  const [pan, setPan] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [kycFront, setKycFront] = useState<string | { uri: string } | null>(
    null
  );
  const [kycBack, setKycBack] = useState<string | { uri: string } | null>(null);
  const [consent, setConsent] = useState(false);
  // touched states for inline validation
  const [touchedAadhaar, setTouchedAadhaar] = useState(false);
  const [touchedPan, setTouchedPan] = useState(false);
  const [touchedFront, setTouchedFront] = useState(false);
  const [touchedBack, setTouchedBack] = useState(false);
  const [touchedConsent, setTouchedConsent] = useState(false);

  // Note: Aadhaar verification step removed per request — we accept Aadhaar as text.

  // PAN Validation
  const validatePAN = (panNumber: string) => {
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return regex.test(panNumber);
  };

  const isAadhaarValid = (a: string) =>
    !!a && a.length === 12 && /^[0-9]{12}$/.test(a);
  const isPanValid = (p: string) => validatePAN(p);
  const canSubmit =
    !submitting &&
    isAadhaarValid(aadhaar) &&
    isPanValid(pan) &&
    !!kycFront &&
    !!kycBack &&
    consent;

  // Submit KYC
  const handleSubmitKYC = async () => {
    // Aadhaar verification removed; accept aadhaar as entered (must be 12 digits)
    if (!isAadhaarValid(aadhaar)) {
      setTouchedAadhaar(true);
      Alert.alert("Error", "Enter a valid 12-digit Aadhaar number");
      return;
    }

    if (!isPanValid(pan)) {
      setTouchedPan(true);
      Alert.alert("Error", "Enter a valid PAN number (e.g., ABCDE1234F)");
      return;
    }

    if (!consent) {
      setTouchedConsent(true);
      Alert.alert("Consent required", "Please provide consent to submit KYC");
      return;
    }

    if (!kycFront || !kycBack) {
      setTouchedFront(true);
      setTouchedBack(true);
      Alert.alert(
        "Images required",
        "Please select both front and back Aadhaar images"
      );
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("aadhaarNumber", aadhaar);
      form.append("panCardNumber", pan);
      form.append(
        "consentText",
        "I consent to submit my Aadhaar for verification"
      );

      // Robust append helper: try to fetch the URI and append a blob (with filename),
      // fallback to RN file obj {uri,name,type} if anything fails.
      const appendRNFile = async (
        fieldName: string,
        fileObj: { uri?: string } | string | null
      ) => {
        if (!fileObj) return;
        const uri = (fileObj as any).uri || (fileObj as any);
        if (!uri) return;

        // try to derive filename and type
        let name = (uri.split("/").pop() || `${fieldName}.jpg`).split("?")[0];
        if (!name.includes(".")) name = `${name}.jpg`;
        const lower = name.toLowerCase();
        const type = lower.endsWith(".png") ? "image/png" : "image/jpeg";

        try {
          // fetch the file and convert to blob, then append with filename
          const fetched = await fetch(uri);
          const blob = await fetched.blob();
          // FormData.append in RN accepts (fieldName, blob, filename)
          form.append(fieldName, blob as any, name);
          return;
        } catch (err) {
          // fallback to RN file object
          try {
            form.append(fieldName, { uri, name, type } as any);
            return;
          } catch (err2) {
            console.log("appendRNFile fallback failed", fieldName, err2);
          }
        }
      };

      await appendRNFile("kycFront", kycFront);
      await appendRNFile("kycBack", kycBack);

      // Use fetch for multipart uploads in React Native. Do NOT set Content-Type;
      // let the runtime include the boundary. Add Accept to help some servers.
      const token = await AsyncStorage.getItem("token");
      const url = `${API_BASE_URL}/profile/submit-kyc`;

      // Debug: log key info so we can see whether the client attempted the call
      console.log("[KYC submit] about to POST", {
        url,
        tokenPresent: !!token,
        kycFrontUri:
          typeof kycFront === "string" ? kycFront : kycFront?.uri || null,
        kycBackUri:
          typeof kycBack === "string" ? kycBack : kycBack?.uri || null,
      });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
          // Note: do not set 'Content-Type' here
        },
        body: form,
      });

      // Helpful debug: log status and body when things go wrong.
      let data: any = null;
      try {
        data = await res.json();
      } catch (err) {
        const text = await res.text();
        console.log("[KYC submit] non-json response", res.status, text);
        throw new Error(`Server returned non-JSON (${res.status}): ${text}`);
      }

      if (!res.ok) {
        console.log("[KYC submit] error response", res.status, data);
        throw data;
      }

      setKycStatus(data.status || data.user?.kycStatus);
      Alert.alert("KYC Submitted", "Your KYC has been submitted successfully!");

      // Persist returned user/token so app state reflects verification immediately
      try {
        let roleVal: string | null = null;
        if (data.token) {
          await AsyncStorage.setItem("token", data.token);
        }
        if (data.user) {
          if (data.user.id)
            await AsyncStorage.setItem("userId", String(data.user.id));
          if (data.user.role) {
            roleVal = data.user.role?.toLowerCase().includes("provider")
              ? "ServiceProvider"
              : "user";
            await AsyncStorage.setItem("userRole", roleVal);
          }
          if (data.user.profilePhoto)
            await AsyncStorage.setItem("profilePhoto", data.user.profilePhoto);
          if (data.user.kycStatus)
            await AsyncStorage.setItem("kycStatus", data.user.kycStatus);
        }

        // Only redirect service providers to profile to see verified badge
        const finalRole = roleVal || (await AsyncStorage.getItem("userRole"));
        if (finalRole === "ServiceProvider") {
          navigation.navigate("Profile");
        }
      } catch (err) {
        console.log("Persisting user/navigating to Profile failed", err);
      }
    } catch (error: any) {
      console.log("[KYC submit] failed", error);
      const message =
        (error && error.message) ||
        (typeof error === "string" ? error : JSON.stringify(error));
      Alert.alert("Error", `Failed to submit KYC — ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const pickImage = async (setter: (val: { uri: string } | null) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      // expo-image-picker returns assets array with uri
      const uri = (result as any).assets?.[0]?.uri || (result as any).uri;
      if (uri) {
        setter({ uri });
        // mark touched for validation
        if (setter === setKycFront) setTouchedFront(true);
        if (setter === setKycBack) setTouchedBack(true);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={["#6366f1", "#8b5cf6", "#a855f7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Ionicons name="shield-checkmark" size={48} color="#ffffff" />
            <Text style={styles.heading}>KYC Verification</Text>
            <Text style={styles.subheading}>
              Complete your verification to unlock all features
            </Text>
          </LinearGradient>

          {/* Aadhaar Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="card" size={20} color="#6366f1" />
              <Text style={styles.cardTitle}>Aadhaar Number</Text>
              <Text style={styles.mandatory}>*</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter 12-digit Aadhaar"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              maxLength={12}
              value={aadhaar}
              onChangeText={(t) => {
                setAadhaar(t);
                setTouchedAadhaar(true);
              }}
            />
            {touchedAadhaar && !isAadhaarValid(aadhaar) && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errorText}>Aadhaar must be 12 digits</Text>
              </View>
            )}
          </View>

          {/* PAN Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#6366f1" />
              <Text style={styles.cardTitle}>PAN Number</Text>
              <Text style={styles.mandatory}>*</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter PAN Number (e.g., ABCDE1234F)"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              maxLength={10}
              value={pan}
              onChangeText={(t) => {
                setPan(t.toUpperCase());
                setTouchedPan(true);
              }}
            />
            {touchedPan && !isPanValid(pan) && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errorText}>
                  Enter valid PAN (ABCDE1234F)
                </Text>
              </View>
            )}
          </View>

          {/* Aadhaar Front Image */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="image" size={20} color="#6366f1" />
              <Text style={styles.cardTitle}>Aadhaar Front Photo</Text>
              <Text style={styles.mandatory}>*</Text>
            </View>
            <TouchableOpacity
              onPress={() => pickImage(setKycFront)}
              activeOpacity={0.7}
            >
              {kycFront ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{
                      uri:
                        typeof kycFront === "string" ? kycFront : kycFront?.uri,
                    }}
                    style={styles.preview}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.6)"]}
                    style={styles.imageOverlay}
                  >
                    <Ionicons name="create" size={20} color="#ffffff" />
                    <Text style={styles.changeText}>Change Photo</Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="cloud-upload" size={40} color="#6366f1" />
                  <Text style={styles.placeholderText}>
                    Tap to upload front image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {touchedFront && !kycFront && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errorText}>Front image is required</Text>
              </View>
            )}
          </View>

          {/* Aadhaar Back Image */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="image" size={20} color="#6366f1" />
              <Text style={styles.cardTitle}>Aadhaar Back Photo</Text>
              <Text style={styles.mandatory}>*</Text>
            </View>
            <TouchableOpacity
              onPress={() => pickImage(setKycBack)}
              activeOpacity={0.7}
            >
              {kycBack ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{
                      uri: typeof kycBack === "string" ? kycBack : kycBack?.uri,
                    }}
                    style={styles.preview}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.6)"]}
                    style={styles.imageOverlay}
                  >
                    <Ionicons name="create" size={20} color="#ffffff" />
                    <Text style={styles.changeText}>Change Photo</Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="cloud-upload" size={40} color="#6366f1" />
                  <Text style={styles.placeholderText}>
                    Tap to upload back image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {touchedBack && !kycBack && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errorText}>Back image is required</Text>
              </View>
            )}
          </View>

          {/* Consent Card */}
          <View style={styles.consentCard}>
            <View style={styles.consentRow}>
              <Switch
                value={consent}
                onValueChange={(val) => {
                  setConsent(val);
                  setTouchedConsent(true);
                }}
                trackColor={{ false: "#cbd5e1", true: "#a5b4fc" }}
                thumbColor={consent ? "#6366f1" : "#f1f5f9"}
              />
              <Text style={styles.consentText}>
                I confirm the Aadhaar images are mine and I consent to storing
                them for verification purposes.
                <Text style={styles.mandatory}> *</Text>
              </Text>
            </View>
            {touchedConsent && !consent && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errorText}>
                  Consent is required to submit KYC
                </Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitKYC}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                canSubmit
                  ? ["#10b981", "#059669", "#047857"]
                  : ["#cbd5e1", "#94a3b8"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButton}
            >
              {submitting ? (
                <Text style={styles.buttonText}>Submitting...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Submit KYC</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Status Card */}
          {kycStatus !== "" && (
            <LinearGradient
              colors={["#d1fae5", "#a7f3d0", "#6ee7b7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusCard}
            >
              <Ionicons name="checkmark-circle" size={24} color="#047857" />
              <Text style={styles.statusText}>KYC Status: {kycStatus}</Text>
            </LinearGradient>
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 12,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: "#e0e7ff",
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
    flex: 1,
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
  imageWrapper: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  changeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  placeholderBox: {
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  placeholderText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  consentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  consentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: "#10b981",
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
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#047857",
    marginLeft: 10,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  mandatory: {
    color: "#ef4444",
    fontWeight: "700",
  },
});
