import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
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
  const [kycFront, setKycFront] = useState<string | null>(null);
  const [kycBack, setKycBack] = useState<string | null>(null);
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

  // Debug: Log state changes
  useEffect(() => {
    console.log("kycFront state changed:", kycFront);
  }, [kycFront]);

  useEffect(() => {
    console.log("kycBack state changed:", kycBack);
  }, [kycBack]);

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

      // Get file URIs
      const kycFrontUri = kycFront;
      const kycBackUri = kycBack;

      if (!kycFrontUri || !kycBackUri) {
        throw new Error("File URIs are missing");
      }

      // Debug: log file info
      console.log("[KYC submit] File URIs:", {
        kycFrontUri,
        kycBackUri,
      });

      // Check file sizes to ensure they're not empty
      try {
        const frontInfo = await FileSystem.getInfoAsync(kycFrontUri);
        const backInfo = await FileSystem.getInfoAsync(kycBackUri);

        console.log("[KYC submit] File info:", {
          front: { exists: frontInfo.exists, size: frontInfo.size },
          back: { exists: backInfo.exists, size: backInfo.size },
        });

        if (!frontInfo.exists || !backInfo.exists) {
          throw new Error("One or more files do not exist");
        }

        if ((frontInfo.size || 0) === 0 || (backInfo.size || 0) === 0) {
          throw new Error("One or more files are empty (0 bytes)");
        }
      } catch (err) {
        console.error("[KYC submit] File check error:", err);
        throw new Error(
          "Failed to verify file integrity: " + (err as Error).message
        );
      }

      // Helper to create proper file object for FormData
      const createFileObject = (uri: string, fieldName: string) => {
        // Get filename from URI
        let filename = uri.split("/").pop() || `${fieldName}.jpg`;
        filename = filename.split("?")[0]; // Remove query params

        // Ensure filename has extension
        if (!filename.includes(".")) {
          filename = `${filename}.jpg`;
        }

        // Determine MIME type from extension
        const extension = filename.toLowerCase().split(".").pop();
        let mimeType = "image/jpeg";
        if (extension === "png") mimeType = "image/png";
        else if (extension === "webp") mimeType = "image/webp";
        else if (extension === "heic" || extension === "heif")
          mimeType = "image/jpeg";

        return {
          uri,
          name: filename,
          type: mimeType,
        };
      };

      // Append files to FormData
      form.append("kycFront", createFileObject(kycFrontUri, "kycFront") as any);
      form.append("kycBack", createFileObject(kycBackUri, "kycBack") as any);

      // Use fetch for multipart uploads in React Native. Do NOT set Content-Type;
      // let the runtime include the boundary. Add Accept to help some servers.
      const token = await AsyncStorage.getItem("token");
      const url = `${API_BASE_URL}/profile/submit-kyc`;

      // Debug: log key info so we can see whether the client attempted the call
      console.log("[KYC submit] about to POST", {
        url,
        tokenPresent: !!token,
        hasKycFront: !!kycFrontUri,
        hasKycBack: !!kycBackUri,
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

        // Only redirect service providers to profile to see submission status
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

  const pickImage = async (setter: (val: string | null) => void) => {
    try {
      // Request permission first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log("Image picker result:", JSON.stringify(result, null, 2));
      console.log("result.canceled:", result.canceled);
      console.log("result.assets:", result.assets);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log("Setting image URI:", uri);
        console.log("setter function:", setter.name);
        console.log("Is setter setKycFront?", setter === setKycFront);
        console.log("Is setter setKycBack?", setter === setKycBack);

        // Direct state update to test
        if (setter === setKycFront) {
          console.log("About to call setKycFront with:", uri);
          setKycFront(uri);
          setTouchedFront(true);
          console.log("setKycFront called");
        } else if (setter === setKycBack) {
          console.log("About to call setKycBack with:", uri);
          setKycBack(uri);
          setTouchedBack(true);
          console.log("setKycBack called");
        }
      } else {
        console.log("Image picker cancelled or no assets");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Debug: Log current state values on every render
  console.log("==== KYCScreen Render ====");
  console.log("kycFront:", kycFront);
  console.log("kycBack:", kycBack);
  console.log("========================");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            {kycFront ? (
              <View>
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: kycFront }}
                    style={styles.preview}
                    resizeMode="cover"
                    onError={(e) =>
                      console.log(
                        "Front image load error:",
                        e.nativeEvent.error
                      )
                    }
                    onLoad={() =>
                      console.log("Front image loaded successfully")
                    }
                  />
                </View>
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.replaceButton}
                    onPress={() => pickImage(setKycFront)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="images" size={18} color="#6366f1" />
                    <Text style={styles.replaceButtonText}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setKycFront(null);
                      setTouchedFront(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => pickImage(setKycFront)}
                activeOpacity={0.7}
              >
                <View style={styles.placeholderBox}>
                  <Ionicons name="cloud-upload" size={40} color="#6366f1" />
                  <Text style={styles.placeholderText}>
                    Tap to upload front image
                  </Text>
                </View>
              </TouchableOpacity>
            )}
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
            {kycBack ? (
              <View>
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: kycBack }}
                    style={styles.preview}
                    resizeMode="cover"
                    onError={(e) =>
                      console.log("Back image load error:", e.nativeEvent.error)
                    }
                    onLoad={() => console.log("Back image loaded successfully")}
                  />
                </View>
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.replaceButton}
                    onPress={() => pickImage(setKycBack)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="images" size={18} color="#6366f1" />
                    <Text style={styles.replaceButtonText}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setKycBack(null);
                      setTouchedBack(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => pickImage(setKycBack)}
                activeOpacity={0.7}
              >
                <View style={styles.placeholderBox}>
                  <Ionicons name="cloud-upload" size={40} color="#6366f1" />
                  <Text style={styles.placeholderText}>
                    Tap to upload back image
                  </Text>
                </View>
              </TouchableOpacity>
            )}
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
  scrollContent: {
    paddingBottom: 140,
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
  imageActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  replaceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#6366f1",
    gap: 6,
  },
  replaceButtonText: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    gap: 6,
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
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
