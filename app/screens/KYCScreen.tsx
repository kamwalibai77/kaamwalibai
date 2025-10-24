import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../utills/config";

export default function KYCVerification() {
  const navigation: any = useNavigation();
  const [aadhaar, setAadhaar] = useState("");
  const [name, setName] = useState("");
  const [pan, setPan] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [kycFront, setKycFront] = useState<any>(null);
  const [kycBack, setKycBack] = useState<any>(null);
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
      const appendRNFile = async (fieldName: string, fileObj: any) => {
        if (!fileObj) return;
        const uri = fileObj.uri || fileObj;
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
        kycFrontUri: kycFront?.uri || kycFront,
        kycBackUri: kycBack?.uri || kycBack,
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

  const pickImage = async (setter: any) => {
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>🔐 KYC Verification</Text>

      {/* Aadhaar Section */}
      <Text style={styles.label}>
        Aadhaar Number <Text style={styles.mandatory}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 12-digit Aadhaar"
        keyboardType="numeric"
        maxLength={12}
        value={aadhaar}
        onChangeText={(t) => {
          setAadhaar(t);
          setTouchedAadhaar(true);
        }}
      />
      {touchedAadhaar && !isAadhaarValid(aadhaar) && (
        <Text style={styles.errorText}>Aadhaar must be 12 digits.</Text>
      )}
      {/* Removed Aadhaar verify button — Aadhaar is accepted as plain text */}

      {/* Aadhaar verification removed — we capture Aadhaar as plain text */}

      {/* PAN Section */}
      <Text style={styles.label}>
        PAN Number <Text style={styles.mandatory}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Enter PAN Number"
        autoCapitalize="characters"
        maxLength={10}
        value={pan}
        onChangeText={(t) => {
          setPan(t.toUpperCase());
          setTouchedPan(true);
        }}
      />
      {touchedPan && !isPanValid(pan) && (
        <Text style={styles.errorText}>Enter a valid PAN (ABCDE1234F).</Text>
      )}

      {/* KYC Images */}
      <Text style={styles.label}>
        Aadhaar Front (Photo) <Text style={styles.mandatory}>*</Text>
      </Text>
      <TouchableOpacity onPress={() => pickImage(setKycFront)}>
        {kycFront ? (
          <Image
            source={{ uri: kycFront.uri || kycFront }}
            style={styles.preview}
          />
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={{ color: "#94a3b8" }}>Pick front image</Text>
          </View>
        )}
      </TouchableOpacity>
      {touchedFront && !kycFront && (
        <Text style={styles.errorText}>Front image is required.</Text>
      )}

      <Text style={styles.label}>
        Aadhaar Back (Photo) <Text style={styles.mandatory}>*</Text>
      </Text>
      <TouchableOpacity onPress={() => pickImage(setKycBack)}>
        {kycBack ? (
          <Image
            source={{ uri: kycBack.uri || kycBack }}
            style={styles.preview}
          />
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={{ color: "#94a3b8" }}>Pick back image</Text>
          </View>
        )}
      </TouchableOpacity>
      {touchedBack && !kycBack && (
        <Text style={styles.errorText}>Back image is required.</Text>
      )}

      {/* Consent */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}
      >
        <Switch
          value={consent}
          onValueChange={(val) => {
            setConsent(val);
            setTouchedConsent(true);
          }}
        />
        <Text style={{ marginLeft: 8, flex: 1 }}>
          I confirm the Aadhaar images are mine and I consent to storing them
          for verification purposes. <Text style={styles.mandatory}>*</Text>
        </Text>
      </View>
      {touchedConsent && !consent && (
        <Text style={styles.errorText}>Consent is required to submit KYC.</Text>
      )}

      <TouchableOpacity
        style={[
          styles.buttonSuccess,
          !canSubmit ? styles.buttonDisabled : null,
          submitting ? { opacity: 0.7 } : null,
        ]}
        onPress={handleSubmitKYC}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Submitting..." : "Submit KYC"}
        </Text>
      </TouchableOpacity>

      {kycStatus !== "" && (
        <View style={[styles.responseCard, { borderColor: "#4CAF50" }]}>
          <Text style={[styles.responseText, { color: "#2E7D32" }]}>
            KYC Status: {kycStatus}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: "#1e293b",
  },
  label: {
    marginTop: 15,
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 16,
    color: "#334155",
  },
  input: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 15,
    borderRadius: 10,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    fontSize: 15,
    elevation: 1,
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
    elevation: 3,
  },
  buttonSuccess: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 20,
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  responseCard: {
    marginTop: 10,
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    borderColor: "#94a3b8",
  },
  responseText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#eef2ff",
  },
  placeholderBox: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  mandatory: {
    color: "#ef4444",
    fontWeight: "700",
  },
  errorText: {
    color: "#ef4444",
    marginTop: 6,
    marginBottom: 6,
    fontSize: 13,
  },
  buttonDisabled: {
    backgroundColor: "#9ae6b4",
  },
});
