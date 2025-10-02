// screens/ProfileEditScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useState, useRef } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  ActivityIndicator,
  Alert,
  View,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import api from "../services/api"; // make sure api.ts is configured with your local IP

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

export default function ProfileEditScreen({ navigation }: Props) {
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

  // location search states
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const lastQueryRef = useRef<string>("");

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

  const fetchSuggestions = async (text: string) => {
    // Do not trigger API for backslash or empty text
    if (text.includes("\\") || text.length < 3) {
      setSuggestions([]);
      setQuery(text);
      lastQueryRef.current = text;
      return;
    }

    // Avoid API trigger if user is deleting text (backspace)
    if (text.length < lastQueryRef.current.length) {
      setQuery(text);
      lastQueryRef.current = text;
      return;
    }

    setQuery(text);
    lastQueryRef.current = text;

    try {
      const res = await api.get("profile/maps/suggest", {
        params: { query: text },
      });
      setSuggestions(res.data.suggestedLocations || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const handleSelectAddress = (item: any) => {
    setQuery(item.placeName);
    setAddress(item.placeName);
    setSuggestions([]);
  };

  const handleCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const currentLoc = {
        placeName: "Current Location",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setQuery(currentLoc.placeName);
      setAddress(`${currentLoc.latitude},${currentLoc.longitude}`);
    } catch (err) {
      console.error("Error getting location:", err);
      Alert.alert("Error", "Could not fetch current location.");
    }
  };

  const handleSave = async () => {
    if (!/^\+91\d{10}$/.test(phoneNumber)) {
      alert("Phone number must be 10 digits after +91");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("role", role);
      formData.append("phoneNumber", phoneNumber);
      formData.append("address", address);
      formData.append("gender", gender || "");
      formData.append("age", age?.toString() || "");

      if (profilePhoto) {
        const fileName = profilePhoto.split("/").pop() || "profile.jpg";

        if (Platform.OS === "web") {
          try {
            const resp = await fetch(profilePhoto);
            const blob = await resp.blob();
            const webFile: any = new File([blob], fileName, {
              type: blob.type || "image/jpeg",
            });
            formData.append("profilePhoto", webFile);
          } catch (webErr) {
            console.error("Failed to prepare web image for upload:", webErr);
            throw new Error("Failed to read selected image for upload (web)");
          }
        } else {
          const file: any = {
            uri: profilePhoto,
            name: fileName,
            type: "image/jpeg",
          };
          formData.append("profilePhoto", file as any);
        }
      }

      await api.put("/profile/update", formData);
      Alert.alert("Success", "Profile updated successfully!");
      navigation.navigate("Profile");
    } catch (e) {
      console.error("Profile update failed:", e);
      const errMsg =
        (e as any)?.response?.data?.error || (e as any)?.message || String(e);
      Alert.alert("Error", `Failed to update profile: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) return;

        const response = await api.get(`/users/${userId}`);
        const data = response.data;
        setId(data.id);
        setName(data.name);
        setRole(data.role);
        setPhoneNumber(
          data.phoneNumber?.startsWith("+91")
            ? data.phoneNumber
            : `+91${data.phoneNumber || ""}`
        );
        setAddress(data.address);
        setQuery(data.address || "");
        setGender(data.gender);
        setAge(data.age);
        setProfilePhoto(data.profilePhoto);
      } catch (err) {
        console.error("Error fetching user:", err);
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

      <View style={styles.profileHeader}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
        ) : (
          <View
            style={[
              styles.profileImage,
              {
                backgroundColor: "#e6e7ee",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Ionicons name="person" size={36} color="#9ca3af" />
          </View>
        )}
        <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
          <Ionicons name="create-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Address</Text>

        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={20}
            color="gray"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.inputNoBorder}
            value={query}
            placeholder="Search city, area or locality"
            onChangeText={fetchSuggestions}
          />
        </View>

        {suggestions.length > 0 && (
          <View style={[styles.dropdown, { width: "100%" }]}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.item}
                onPress={() => handleSelectAddress(item)}
              >
                <Text style={styles.itemText}>{item.placeName}</Text>
                <Text style={styles.itemSubText}>
                  {item.placeAddress || ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ...styles remain the same

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
  inputNoBorder: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    height: 45,
  },
  currentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 12,
  },
  currentLocationText: {
    marginLeft: 8,
    color: "#003580",
    fontWeight: "500",
  },
  dropdown: { maxHeight: 200, marginBottom: 12 },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: { fontSize: 16 },
  itemSubText: { fontSize: 12, color: "gray" },
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
  pingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  pingButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
