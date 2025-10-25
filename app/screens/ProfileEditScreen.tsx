// screens/ProfileEditScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";
import { API_BASE_URL } from "../utills/config";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

export default function ProfileEditScreen({ navigation, route }: Props) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const needsRole = (route?.params as any)?.needsRole === true;

  // Dropdown states
  const [genderOpen, setGenderOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);

  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);

  // location search states
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
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
    if (text.includes("\\") || text.length < 3) {
      setSuggestions([]);
      setQuery(text);
      lastQueryRef.current = text;
      return;
    }

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
    if (item.lat) setLatitude(Number(item.lat));
    if (item.lng) setLongitude(Number(item.lng));
  };
  const handleSave = async () => {
    if (!/^\+91\d{10}$/.test(phoneNumber)) {
      Alert.alert("Invalid Number", "Phone number must be 10 digits after +91");
      return;
    }

    const needsRole = (route?.params as any)?.needsRole === true;
    if (needsRole && !role) {
      Alert.alert("Select role", "Please select a role to continue.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("role", role);
      formData.append("phoneNumber", phoneNumber);
      formData.append("address", address);
      if (latitude) formData.append("latitude", String(latitude));
      if (longitude) formData.append("longitude", String(longitude));
      formData.append("gender", gender || "");
      formData.append("age", age?.toString() || "");

      // ✅ Only attach new local image, not remote URL
      if (profilePhoto && !profilePhoto.startsWith("http")) {
        // keep the FormData path for environments that support multipart,
        // but on Expo/React Native axios multipart is flaky. We'll prefer
        // a fetch+FormData blob approach when sending from device.
        const fetched = await fetch(profilePhoto);
        const blob = await fetched.blob();
        formData.append("profilePhoto", blob as any, "profile.jpg");
      }

      let data: any = null;
      const userId = await AsyncStorage.getItem("userId");

      // ✅ Case 1: Signup User completing profile
      if (!userId) {
        const tempToken = await AsyncStorage.getItem("token");
        if (!tempToken) {
          Alert.alert(
            "Error",
            "Missing signup token. Please verify OTP again."
          );
          setLoading(false);
          return;
        }
        // Prefer a fetch-based multipart upload on device; if no local image
        // is present send JSON via the simple endpoint.
        const apiHost = API_BASE_URL.replace(/\/api\/?$/, "");
        if (profilePhoto && !profilePhoto.startsWith("http")) {
          try {
            // Try fetch multipart
            const resp = await fetch(profilePhoto);
            const blob = await resp.blob();
            const fd = new FormData();
            fd.append("profilePhoto", blob as any, "profile.jpg");
            fd.append("name", name);
            fd.append("role", role);
            fd.append("address", address);
            fd.append("gender", gender || "");
            fd.append("age", age?.toString() || "");
            if (latitude) fd.append("latitude", String(latitude));
            if (longitude) fd.append("longitude", String(longitude));

            const r = await fetch(`${apiHost}/api/auth/complete-signup`, {
              method: "POST",
              headers: { Authorization: `Bearer ${tempToken}` },
              body: fd,
            });
            if (!r.ok) {
              const txt = await r.text();
              throw new Error(`Signup upload failed ${r.status}: ${txt}`);
            }
            data = await r.json();
          } catch (err) {
            console.warn("Signup multipart failed, trying base64 fallback:", err);
            // Base64 fallback
            try {
              const b64 = await FileSystem.readAsStringAsync(profilePhoto, { encoding: 'base64' });
              const payload = {
                profilePhotoBase64: `data:image/jpeg;base64,${b64}`,
                name,
                role,
                address,
                gender,
                age,
                latitude,
                longitude,
              } as any;
              const fallbackRes = await fetch(`${apiHost}/api/auth/complete-signup-base64`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${tempToken}`,
                },
                body: JSON.stringify(payload),
              });
              if (!fallbackRes.ok) {
                const txt = await fallbackRes.text();
                throw new Error(`Signup base64 failed ${fallbackRes.status}: ${txt}`);
              }
              data = await fallbackRes.json();
            } catch (b64Err) {
              console.error("Signup base64 fallback failed:", b64Err);
              Alert.alert("Error", "Signup failed");
              setLoading(false);
              return;
            }
          }
        } else {
          // No local image — use JSON simple endpoint
          try {
            const fallbackResp = await api.post(
              "/auth/complete-signup-simple",
              {
                name,
                role,
                address,
                gender,
                age,
                latitude,
                longitude,
              },
              { headers: { Authorization: `Bearer ${tempToken}` } }
            );
            data = fallbackResp.data;
          } catch (err) {
            console.error("Signup simple failed:", err);
            Alert.alert("Error", "Signup failed");
            setLoading(false);
            return;
          }
        }

        if (!data?.ok) {
          Alert.alert("Error", data?.error || "Signup failed");
          return;
        }

        if (data.token) await AsyncStorage.setItem("token", data.token);
        if (data.user?.id)
          await AsyncStorage.setItem("userId", String(data.user.id));
        if (data.user?.role) {
          await AsyncStorage.setItem(
            "userRole",
            data.user.role.toLowerCase().includes("provider")
              ? "ServiceProvider"
              : "user"
          );
        }

        Alert.alert("Success", "Signup completed!");
        navigation.navigate("Profile");
        return;
      }

      // ✅ Case 2: Update existing profile
      // Use a fetch-based upload for device-friendly multipart handling.
      const userToken = await AsyncStorage.getItem("token");
      const apiHost = API_BASE_URL.replace(/\/api\/?$/, "");

      if (profilePhoto && !profilePhoto.startsWith("http")) {
        // Upload via fetch+FormData (recommended on Expo)
        try {
          const upload = async () => {
            // convert file URI to blob
            const resp = await fetch(profilePhoto);
            const blob = await resp.blob();

            const fd = new FormData();
            fd.append("profilePhoto", blob as any, "profile.jpg");
            fd.append("name", name);
            fd.append("role", role);
            fd.append("phoneNumber", phoneNumber);
            fd.append("address", address);
            if (latitude) fd.append("latitude", String(latitude));
            if (longitude) fd.append("longitude", String(longitude));
            fd.append("gender", gender || "");
            fd.append("age", age?.toString() || "");

            const res = await fetch(`${apiHost}/api/profile/update`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${userToken}`,
                // IMPORTANT: do NOT set Content-Type — let fetch set the boundary
              },
              body: fd,
            });

            if (!res.ok) {
              const txt = await res.text();
              throw new Error(`Upload failed ${res.status}: ${txt}`);
            }
            return res.json();
          };

          data = await upload();
        } catch (err) {
          console.warn("fetch multipart upload failed, trying base64 fallback:", err);
          // Fallback: read file as base64 and post to the base64 endpoint
          try {
            const b64 = await FileSystem.readAsStringAsync(profilePhoto, {
              encoding: 'base64',
            });
            const payload = {
              profilePhotoBase64: `data:image/jpeg;base64,${b64}`,
              name,
              role,
              phoneNumber,
              address,
              latitude,
              longitude,
              gender,
              age,
            } as any;

            const fallbackRes = await fetch(`${apiHost}/api/profile/upload-photo-base64`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
              },
              body: JSON.stringify(payload),
            });
            if (!fallbackRes.ok) {
              const txt = await fallbackRes.text();
              throw new Error(`Base64 upload failed ${fallbackRes.status}: ${txt}`);
            }
            data = await fallbackRes.json();
          } catch (b64Err) {
            console.error("Base64 fallback failed:", b64Err);
            throw b64Err;
          }
        }
      } else {
        // No new local image — send JSON payload via axios
        const jsonBody: any = {
          name,
          role,
          phoneNumber,
          address,
          gender,
          age,
        };
        if (latitude) jsonBody.latitude = latitude;
        if (longitude) jsonBody.longitude = longitude;

        const updateResp = await api.put("/profile/update", jsonBody);
        data = updateResp.data;
      }

      if (!data?.success || !data.user) {
        Alert.alert("Error", "Failed to update profile.");
        return;
      }

      // ✅ Update local state and storage (new profile pic URL!)
      await AsyncStorage.setItem(
        "userRole",
        data.user.role?.toLowerCase().includes("provider")
          ? "ServiceProvider"
          : "user"
      );
      if (data.user.profilePhoto) {
        await AsyncStorage.setItem("profilePhoto", data.user.profilePhoto);
        setProfilePhoto(data.user.profilePhoto);
      }

      Alert.alert("Success", "Profile updated successfully!");
      navigation.navigate("Profile");
    } catch (error) {
      console.error("handleSave error:", error);
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try to get phone number from AsyncStorage first
        let phone = await AsyncStorage.getItem("phoneNumber");
        console.log("[profileEdit] phone from AsyncStorage:", phone);
        if (phone && phone.length >= 10) {
          setPhoneNumber(phone.startsWith("+91") ? phone : `+91${phone}`);
        }
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) return;

        const response = await api.get(`/users/${userId}`);
        const data = response.data;
        setId(data.id);
        setName(data.name);
        setRole(data.role);
        // If phone not set from AsyncStorage, use API value
        if (!phone || phone.length < 10) {
          const apiPhone = data.phoneNumber?.startsWith("+91")
            ? data.phoneNumber
            : `+91${data.phoneNumber || ""}`;
          console.log("[profileEdit] phone from API:", apiPhone);
          setPhoneNumber(apiPhone);
        }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
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
            <Ionicons name="camera" size={16} color="#fff" />
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
            {/* 📍 Use Current Location Button */}
            <TouchableOpacity
              onPress={async () => {
                let { status } =
                  await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert(
                    "Permission denied",
                    "Location access is needed."
                  );
                  return;
                }
                let loc = await Location.getCurrentPositionAsync({});
                setLatitude(loc.coords.latitude);
                setLongitude(loc.coords.longitude);

                let [reverse] = await Location.reverseGeocodeAsync(loc.coords);
                if (reverse) {
                  const fullAddress = `${reverse.name || ""} ${
                    reverse.street || ""
                  }, ${reverse.city || ""}, ${reverse.region || ""}, ${
                    reverse.country || ""
                  }`;
                  setAddress(fullAddress);
                  setQuery(fullAddress);
                }
              }}
            >
              <Ionicons name="locate-outline" size={22} color="#2563eb" />
            </TouchableOpacity>
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
            editable={false} // phone number is not editable
          />

          <Text style={styles.label}>Role</Text>
          {/* // If route asks for role and this is a NEW user (no id yet), show a selector.
                  // Previously this depended on `!role` which could accidentally hide the selector. */}
          {needsRole && !id ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ marginBottom: 8, color: "#374151" }}>
                Select your role
              </Text>
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    { marginRight: 8 },
                    role === "user" && styles.roleActive,
                  ]}
                  onPress={() => setRole("user")}
                >
                  <Text
                    style={
                      role === "user" ? styles.roleTextActive : styles.roleText
                    }
                  >
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    role === "serviceProvider" && styles.roleActive,
                  ]}
                  onPress={() => setRole("serviceProvider")}
                >
                  <Text
                    style={
                      role === "serviceProvider"
                        ? styles.roleTextActive
                        : styles.roleText
                    }
                  >
                    Service Provider
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Role should be non-editable once set (existing users). Show a friendly label.
            <TextInput
              placeholder="Role"
              value={
                role
                  ? role.toLowerCase().includes("provider")
                    ? "Service Provider"
                    : "User"
                  : ""
              }
              editable={false}
              style={[styles.input, { backgroundColor: "#f8fafc" }]}
            />
          )}

          <Text style={styles.label}>Gender</Text>
          <View
            style={[
              styles.dropdownWrapper,
              { zIndex: genderOpen ? 3000 : 1000 },
            ]}
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
              listMode="SCROLLVIEW"
              scrollViewProps={{ nestedScrollEnabled: true }}
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
              dropDownContainerStyle={[
                styles.dropDownContainer,
                { maxHeight: 420 },
              ]}
              listMode="MODAL"
              modalProps={{ animationType: "slide" }}
              modalTitle="Select Age"
              modalContentContainerStyle={{ margin: 12 }}
              flatListProps={{ initialNumToRender: 20 }}
            />
          </View>
        </View>

        {/* Save button wrapped in container */}
        <View style={{ width: "100%", marginBottom: 20 }}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
    right: 0,
    backgroundColor: "#2563eb",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
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
  roleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8,
    borderRadius: 8,
  },
  roleActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  roleText: { color: "#374151", fontWeight: "500" },
  roleTextActive: { color: "#fff", fontWeight: "600" },
});
