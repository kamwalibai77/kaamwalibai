import { Ionicons } from "@expo/vector-icons"; // For pencil icon
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker"; // For dropdown
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

// ✅ Cloudinary details
const CLOUD_NAME = "dvjzsuy1x";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = "profile_upload"; // unsigned preset

export default function ProfileScreen() {
  const [role, setRole] = useState<string>("user");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("18");

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [aadharPhoto, setAadharPhoto] = useState<string | null>(null);
  const [panPhoto, setPanPhoto] = useState<string | null>(null);

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  // Fetch role from AsyncStorage
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

  // Pick image and upload to Cloudinary
  const pickImage = async (
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo access to upload images."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const uploadedUrl = await uploadToCloudinary(uri);
      if (uploadedUrl) setImage(uploadedUrl);
    }
  };

  // ✅ Upload image to Cloudinary
  // Upload image to Cloudinary
  // Upload image to Cloudinary
  const uploadToCloudinary = async (uri: string) => {
    try {
      const formData = new FormData();

      formData.append("file", {
        uri: uri, // ✅ must be string
        type: "image/jpeg",
        name: "upload.jpg",
      } as any);

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();
      console.log("Cloudinary Response:", result);

      if (result.secure_url) {
        return result.secure_url;
      } else {
        Alert.alert("Upload Error", result.error?.message || "Upload failed");
        return null;
      }
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      Alert.alert("Error", "Cloudinary upload failed");
      return null;
    }
  };

  // Save Profile
  const handleSave = async () => {
    if (!mobile || !address || !gender || !age) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (role === "ServiceProvider" && (!aadharPhoto || !panPhoto)) {
      Alert.alert("Error", "Please upload Aadhaar and PAN card photos");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");

      const payload = {
        mobile,
        address,
        gender,
        age,
        profilePhoto,
        aadharPhoto,
        panPhoto,
      };

      const response = await fetch(
        "http://192.168.1.10:5000/api/profile/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

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

            {/* Profile Photo Circle with Edit */}
            <View style={styles.profileWrapper}>
              <TouchableOpacity onPress={() => pickImage(setProfilePhoto)}>
                {profilePhoto ? (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons name="person" size={64} color="#6366f1" />
                  </View>
                )}
                <View style={styles.editIcon}>
                  <Ionicons name="pencil" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Mobile */}
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />

            {/* Address */}
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Address"
              value={address}
              onChangeText={setAddress}
            />

            {/* Gender */}
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Gender"
              value={gender}
              onChangeText={setGender}
            />

            {/* Age Dropdown */}
            <Text style={styles.label}>Age</Text>
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={age}
                onValueChange={(itemValue) => setAge(itemValue)}
                style={{ width: "100%" }}
              >
                {Array.from({ length: 63 }, (_, i) => i + 18).map((val) => (
                  <Picker.Item
                    key={val}
                    label={val.toString()}
                    value={val.toString()}
                  />
                ))}
              </Picker>
            </View>

            {/* Aadhaar & PAN for ServiceProvider */}
            {role === "ServiceProvider" && (
              <>
                <Text style={styles.label}>Aadhaar Card Photo</Text>
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={() => pickImage(setAadharPhoto)}
                >
                  {aadharPhoto ? (
                    <Image
                      source={{ uri: aadharPhoto }}
                      style={styles.imagePreview}
                    />
                  ) : (
                    <Text style={styles.uploadText}>Upload Aadhaar</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>PAN Card Photo</Text>
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={() => pickImage(setPanPhoto)}
                >
                  {panPhoto ? (
                    <Image
                      source={{ uri: panPhoto }}
                      style={styles.imagePreview}
                    />
                  ) : (
                    <Text style={styles.uploadText}>Upload PAN</Text>
                  )}
                </TouchableOpacity>
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
                {role === "ServiceProvider" ? (
                  <Text style={styles.buttonText}>Submit for KYC</Text>
                ) : (
                  <Text style={styles.buttonText}>Save Profile</Text>
                )}
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
  cardWeb: { width: "50%", maxWidth: 800, minHeight: 600, padding: 40 },
  cardMobile: { width: "90%", minHeight: 500, padding: 24 },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 24,
    textAlign: "center",
  },

  profileWrapper: { marginBottom: 20, position: "relative" },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#6366f1",
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#6366f1",
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
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
  pickerBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#f1f5f9",
  },

  uploadBox: {
    width: "100%",
    height: 150,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: { color: "#6366f1", fontWeight: "600" },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    resizeMode: "cover",
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
