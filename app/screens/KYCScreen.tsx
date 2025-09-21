import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import api from "../services/api";

export default function KYCVerification() {
  const [aadhaar, setAadhaar] = useState("");
  const [name, setName] = useState("");
  const [aadhaarStatus, setAadhaarStatus] = useState("");
  const [pan, setPan] = useState("");
  const [kycStatus, setKycStatus] = useState("");

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

    try {
      const res = await api.post("/profile/submit-kyc", { aadhaar, pan });
      setKycStatus(res.data.status);
      Alert.alert("KYC Submitted", "Your KYC has been submitted successfully!");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to submit KYC");
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
});
