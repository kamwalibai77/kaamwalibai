import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker"; // ✅ Dropdown
import api from "../services/api";

export default function ProfileEditScreen() {
  const router = useRouter();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Pick image + upload
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // ✅ Validate Mobile number
    if (!/^\+91\d{10}$/.test(mobile)) {
      alert("Mobile number must be 10 digits after +91");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("role", role);
      formData.append("mobile", mobile);
      formData.append("address", address);
      formData.append("gender", gender);
      formData.append("age", age);

      if (profilePhoto) {
        const response = await fetch(profilePhoto);
        const profilePhotoBlob = await response.blob();
        formData.append("profilePhoto", profilePhotoBlob, "profile.jpg");
      }

      await api.put("/profile/update", formData);
    } catch (e) {
      console.log(e);
    }
    router.navigate("/screens/ProfileScreen");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) return;

        const response = await api.get(
          `http://localhost:5000/api/users/${userId}`
        );
        const data = await response.data;
        setId(data.id);
        setName(data.name);
        setRole(data.role);
        setMobile(
          data.mobile?.startsWith("+91")
            ? data.mobile
            : `+91${data.mobile || ""}`
        );
        setAddress(data.address);
        setGender(data.gender);
        setAge(data.age?.toString());
        setProfilePhoto(data.profilePhoto);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={styles.gradient}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
          <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={styles.label}>Role</Text>
          <TextInput
            value={role}
            style={[
              styles.input,
              { backgroundColor: "#f1f5f9", color: "#475569" },
            ]} // gray background
            editable={false} // 🚫 Not editable
          />

          {/* 🚫 Location Removed */}

          <Text style={styles.label}>Mobile</Text>
          <TextInput
            value={mobile}
            onChangeText={(text) => {
              let clean = text.replace(/\D/g, ""); // only numbers
              if (clean.startsWith("91")) clean = clean.substring(2);
              if (clean.length > 10) clean = clean.substring(0, 10);
              setMobile(`+91${clean}`);
            }}
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={13} // +91XXXXXXXXXX
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            autoCapitalize="characters" // ✅ Accepts CAPITALS
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={gender}
              onValueChange={(value) => setGender(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>

          <Text style={styles.label}>Age</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={age}
              onValueChange={(value) => setAge(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Age" value="" />
              {Array.from({ length: 83 }, (_, i) => i + 18).map((val) => (
                <Picker.Item key={val} label={`${val}`} value={`${val}`} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  profileHeader: { alignItems: "center", marginBottom: 24 },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#6366f1",
    marginBottom: 12,
  },
  changePhotoBtn: {
    flexDirection: "row",
    backgroundColor: "#6366f1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  changePhotoText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1e293b",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    color: "#1e293b",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  picker: {
    height: 44,
    width: "100%",
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 16,
  },
});
