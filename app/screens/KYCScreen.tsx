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
import api from "../services/api";

export default function KYCVerification() {
  const [aadhaar, setAadhaar] = useState("");
  const [name, setName] = useState("");
  const [aadhaarStatus, setAadhaarStatus] = useState("");
  const [pan, setPan] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [kycFront, setKycFront] = useState<any>(null);
  const [kycBack, setKycBack] = useState<any>(null);
  const [consent, setConsent] = useState(false);

  // Aadhaar Verification
  const handleVerifyAadhaar = async () => {
    if (aadhaar.length !== 12) {
      Alert.alert("Error", "Enter a valid 12-digit Aadhaar number");
      return;
    }

    try {
      const res = await api.post("/profile/verify-aadhaar", { aadhaar });
      setAadhaarStatus(res.data.status);
      setName(res.data.name);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to verify Aadhaar");
    }
  };

  // PAN Validation
  const validatePAN = (panNumber: string) => {
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return regex.test(panNumber);
  };

  // Submit KYC
  const handleSubmitKYC = async () => {
    if (!aadhaarStatus || aadhaarStatus !== "Verified") {
      Alert.alert("Error", "Please verify Aadhaar first");
      return;
    }

    if (!validatePAN(pan)) {
      Alert.alert("Error", "Enter a valid PAN number (e.g., ABCDE1234F)");
      return;
    }

    if (!consent) {
      Alert.alert("Consent required", "Please provide consent to submit KYC");
      return;
    }

    try {
      const form = new FormData();
      form.append("aadhaarNumber", aadhaar);
      form.append("panCardNumber", pan);
      form.append(
        "consentText",
        "I consent to submit my Aadhaar for verification"
      );

      // Helper to append blob from local uri
      const appendFile = async (fieldName: string, fileUri: string | null) => {
        if (!fileUri) return;
        const res = await fetch(fileUri);
        const blob = await res.blob();
        // @ts-ignore
        form.append(fieldName, blob, `${fieldName}.jpg`);
      };

      await appendFile("kycFront", kycFront?.uri || kycFront);
      await appendFile("kycBack", kycBack?.uri || kycBack);

      // Use axios instance which attaches token via interceptor
      const res = await api.post("/profile/submit-kyc", form);
      const data = res.data;
      setKycStatus(data.status || data.user?.kycStatus);
      Alert.alert("KYC Submitted", "Your KYC has been submitted successfully!");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to submit KYC");
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
      if (uri) setter({ uri });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>🔐 KYC Verification</Text>

      {/* Aadhaar Section */}
      <Text style={styles.label}>Aadhaar Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 12-digit Aadhaar"
        keyboardType="numeric"
        maxLength={12}
        value={aadhaar}
        onChangeText={setAadhaar}
      />
      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={handleVerifyAadhaar}
      >
        <Text style={styles.buttonText}>Verify Aadhaar</Text>
      </TouchableOpacity>

      {aadhaarStatus !== "" && (
        <View style={styles.responseCard}>
          <Text style={styles.responseText}>Status: {aadhaarStatus}</Text>
          <Text style={styles.responseText}>Name: {name}</Text>
        </View>
      )}

      {/* PAN Section */}
      <Text style={styles.label}>PAN Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter PAN Number"
        autoCapitalize="characters"
        maxLength={10}
        value={pan}
        onChangeText={setPan}
      />

      {/* KYC Images */}
      <Text style={styles.label}>Aadhaar Front (Photo)</Text>
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

      <Text style={styles.label}>Aadhaar Back (Photo)</Text>
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

      {/* Consent */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}
      >
        <Switch value={consent} onValueChange={setConsent} />
        <Text style={{ marginLeft: 8, flex: 1 }}>
          I confirm the Aadhaar images are mine and I consent to storing them
          for verification purposes.
        </Text>
      </View>

      <TouchableOpacity style={styles.buttonSuccess} onPress={handleSubmitKYC}>
        <Text style={styles.buttonText}>Submit KYC</Text>
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
});
