import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const [role, setRole] = useState<string>("user");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [pan, setPan] = useState("");

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  // fetch role from AsyncStorage
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        if (storedRole) setRole(storedRole);
      } catch (err) {
        console.log(err);
      }
    };
    fetchRole();
  }, []);

  const handleSave = async () => {
    if (!mobile || !address || !gender || !age) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    // For service provider, ensure KYC fields are filled
    if (role === "serviceprovider" && (!aadhar || !pan)) {
      Alert.alert("Error", "Please fill Aadhar and PAN for Service Provider");
      return;
    }

    try {
      // Save profile API call
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch("http://localhost:5000/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mobile, address, gender, age, aadhar, pan }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", data.error || "Update failed");
      }
    } catch (err) {
      Alert.alert("Error", "Network error");
    }
  };

  return (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[styles.card, isMobile ? styles.cardMobile : styles.cardWeb]}
          >
            <Text style={[styles.title, isMobile && { fontSize: 28 }]}>
              Update Profile
            </Text>

            {/* Mobile Number */}
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={[styles.input, isMobile && { height: 40, fontSize: 14 }]}
              placeholder="Enter Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />

            {/* Address */}
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, isMobile && { height: 40, fontSize: 14 }]}
              placeholder="Enter Address"
              value={address}
              onChangeText={setAddress}
            />

            {/* Gender */}
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={[styles.input, isMobile && { height: 40, fontSize: 14 }]}
              placeholder="Enter Gender"
              value={gender}
              onChangeText={setGender}
            />

            {/* Age */}
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={[styles.input, isMobile && { height: 40, fontSize: 14 }]}
              placeholder="Enter Age"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />

            {/* KYC Fields for Service Provider */}
            {role === "serviceprovider" && (
              <>
                <Text style={styles.label}>Aadhar Number</Text>
                <TextInput
                  style={[
                    styles.input,
                    isMobile && { height: 40, fontSize: 14 },
                  ]}
                  placeholder="Enter Aadhar Number"
                  value={aadhar}
                  onChangeText={setAadhar}
                  keyboardType="number-pad"
                />

                <Text style={styles.label}>PAN Number</Text>
                <TextInput
                  style={[
                    styles.input,
                    isMobile && { height: 40, fontSize: 14 },
                  ]}
                  placeholder="Enter PAN Number"
                  value={pan}
                  onChangeText={setPan}
                  autoCapitalize="characters"
                />
              </>
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <LinearGradient
                colors={["#6366f1", "#4f46e5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Save Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    alignItems: "center",
  },
  cardWeb: {
    width: "50%",
    maxWidth: 800,
    minHeight: 600,
    padding: 40,
  },
  cardMobile: {
    width: "90%",
    minHeight: 500,
    padding: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: "#f1f5f9",
    color: "#334155",
  },
  button: {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 10,
  },
  buttonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
