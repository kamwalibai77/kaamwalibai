import { Ionicons } from "@expo/vector-icons";
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
import api from "../services/api";
import DropDownPicker from "react-native-dropdown-picker";

export default function ProfileEditScreen() {
  const router = useRouter();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [genderOpen, setGenderOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);

  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);

  const genderItems = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];

  const ageItems = Array.from({ length: 83 }, (_, i) => ({
    label: `${i + 18}`,
    value: i + 18,
  }));

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
    if (!/^\+91\d{10}$/.test(phoneNumber)) {
      alert("Phone number must be 10 digits after +91");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("role", role);
      formData.append("phoneNumber", phoneNumber);
      formData.append("address", address);
      formData.append("gender", gender || "");
      formData.append("age", age?.toString() || "");

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
        setPhoneNumber(
          data.phoneNumber?.startsWith("+91")
            ? data.phoneNumber
            : `+91${data.phoneNumber || ""}`
        );
        setAddress(data.address);
        setGender(data.gender);
        setAge(data.age);
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
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profile</Text>

      {/* Profile Image */}
      <View style={styles.profileHeader}>
        <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
        <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
          <Ionicons name="create-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          placeholder="Enter your address"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
        />

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          placeholder="Enter mobile number"
          value={phoneNumber}
          onChangeText={(text) => {
            let clean = text.replace(/\D/g, "");
            if (clean.startsWith("91")) clean = clean.substring(2);
            if (clean.length > 10) clean = clean.substring(0, 10);
            setPhoneNumber(`+91${clean}`);
          }}
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={13}
        />

        <Text style={styles.label}>Role</Text>
        <TextInput
          placeholder="Role"
          value={role}
          editable={false}
          style={[styles.input, { backgroundColor: "#f8fafc" }]}
        />

        {/* Gender Dropdown */}
        <Text style={styles.label}>Gender</Text>
        <View
          style={[styles.dropdownWrapper, { zIndex: genderOpen ? 3000 : 1000 }]}
        >
          <DropDownPicker
            open={genderOpen}
            setOpen={setGenderOpen}
            value={gender}
            setValue={setGender}
            items={genderItems}
            placeholder="Select Gender"
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            dropDownContainerStyle={styles.dropDownContainer}
          />
        </View>

        {/* Age Dropdown */}
        <Text style={styles.label}>Age</Text>
        <View
          style={[styles.dropdownWrapper, { zIndex: ageOpen ? 2000 : 500 }]}
        >
          <DropDownPicker
            open={ageOpen}
            setOpen={setAgeOpen}
            value={age}
            setValue={setAge}
            items={ageItems}
            placeholder="Select Age"
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            dropDownContainerStyle={styles.dropDownContainer}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#2563eb",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#2563eb",
    padding: 6,
    borderRadius: 20,
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#1e293b",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  dropdownWrapper: {
    marginBottom: 18,
    position: "relative",
  },
  dropdown: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  dropdownText: {
    fontSize: 14,
    color: "#111827",
  },
  dropDownContainer: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    maxHeight: 200,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
});
