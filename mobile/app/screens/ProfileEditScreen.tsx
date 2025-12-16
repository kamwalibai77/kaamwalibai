// screens/ProfileEditScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
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

export default function ProfileEditScreen({ navigation, route }: Props): any {
  const [id, setId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
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
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload a profile picture."
      );
      return;
    }

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
            console.warn(
              "Signup multipart failed, trying base64 fallback:",
              err
            );
            // Base64 fallback
            try {
              const b64 = await FileSystem.readAsStringAsync(profilePhoto, {
                encoding: "base64",
              });
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
              const fallbackRes = await fetch(
                `${apiHost}/api/auth/complete-signup-base64`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tempToken}`,
                  },
                  body: JSON.stringify(payload),
                }
              );
              if (!fallbackRes.ok) {
                const txt = await fallbackRes.text();
                throw new Error(
                  `Signup base64 failed ${fallbackRes.status}: ${txt}`
                );
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
          setLoading(false);
          return;
        }

        console.log("Signup response user data:", data.user);
        console.log("Profile photo URL:", data.user?.profilePhoto);

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
        // Store complete user data including profilePhoto
        if (data.user) {
          const userDataString = JSON.stringify(data.user);
          console.log("Storing userData in AsyncStorage:", userDataString.substring(0, 200));
          await AsyncStorage.setItem("userData", userDataString);
          console.log("userData stored successfully");
        }

        setLoading(false);

        // Navigate after alert is dismissed
        Alert.alert("Success", "Signup completed!", [
          {
            text: "OK",
            onPress: async () => {
              // Small delay to ensure all AsyncStorage operations complete
              await new Promise(resolve => setTimeout(resolve, 100));
              console.log("Navigating to Profile screen...");
              navigation.replace("Profile");
            },
          },
        ]);
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
          console.warn(
            "fetch multipart upload failed, trying base64 fallback:",
            err
          );
          // Fallback: read file as base64 and post to the base64 endpoint
          try {
            const b64 = await FileSystem.readAsStringAsync(profilePhoto, {
              encoding: "base64",
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

            const fallbackRes = await fetch(
              `${apiHost}/api/profile/upload-photo-base64`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify(payload),
              }
            );
            if (!fallbackRes.ok) {
              const txt = await fallbackRes.text();
              throw new Error(
                `Base64 upload failed ${fallbackRes.status}: ${txt}`
              );
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ flex: 1 }}>
        {/* Gradient Header */}
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#c084fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileHeader}>
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.profileImage}
              />
            ) : (
              <View
                style={[
                  styles.profileImage,
                  {
                    backgroundColor: "#e0e7ff",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <Ionicons name="person" size={48} color="#8b5cf6" />
              </View>
            )}
            <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person-outline" size={18} color="#8b5cf6" />
                <Text style={styles.label}>Name</Text>
              </View>
              <TextInput
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location-outline" size={18} color="#8b5cf6" />
                <Text style={styles.label}>Address</Text>
              </View>
              <View style={styles.searchRow}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color="#94a3b8"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.inputNoBorder}
                  value={query}
                  placeholder="Search city, area or locality"
                  placeholderTextColor="#94a3b8"
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

                    let [reverse] = await Location.reverseGeocodeAsync(
                      loc.coords
                    );
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
                  <Ionicons name="locate-outline" size={22} color="#8b5cf6" />
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
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="call-outline" size={18} color="#8b5cf6" />
                <Text style={styles.label}>Mobile Number</Text>
              </View>
              <TextInput
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChangeText={(text) => {
                  let clean = text.replace(/\D/g, "");
                  if (clean.startsWith("91")) clean = clean.substring(2);
                  if (clean.length > 10) clean = clean.substring(0, 10);
                  setPhoneNumber(`+91${clean}`);
                }}
                style={[styles.input, styles.disabledInput]}
                keyboardType="phone-pad"
                maxLength={13}
                editable={false} // phone number is not editable
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="briefcase-outline" size={18} color="#8b5cf6" />
                <Text style={styles.label}>Role</Text>
              </View>
              {/* // If route asks for role and this is a NEW user (no id yet), show a selector.
                  // Previously this depended on `!role` which could accidentally hide the selector. */}
              {needsRole && !id ? (
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      style={[
                        styles.roleBtn,
                        role === "user" && styles.roleActive,
                      ]}
                      onPress={() => setRole("user")}
                    >
                      <Ionicons
                        name="person"
                        size={20}
                        color={role === "user" ? "#fff" : "#8b5cf6"}
                        style={{ marginBottom: 4 }}
                      />
                      <Text
                        style={
                          role === "user"
                            ? styles.roleTextActive
                            : styles.roleText
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
                      <Ionicons
                        name="briefcase"
                        size={20}
                        color={role === "serviceProvider" ? "#fff" : "#8b5cf6"}
                        style={{ marginBottom: 4 }}
                      />
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
                  style={[styles.input, styles.disabledInput]}
                  placeholderTextColor="#94a3b8"
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons
                  name="male-female-outline"
                  size={18}
                  color="#8b5cf6"
                />
                <Text style={styles.label}>Gender</Text>
              </View>
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
                  style={styles.dropdownStyle}
                  textStyle={styles.dropdownText}
                  dropDownContainerStyle={styles.dropDownContainer}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="calendar-outline" size={18} color="#8b5cf6" />
                <Text style={styles.label}>Age</Text>
              </View>
              <View
                style={[
                  styles.dropdownWrapper,
                  { zIndex: ageOpen ? 2000 : 500 },
                ]}
              >
                <DropDownPicker
                  open={ageOpen}
                  setOpen={setAgeOpen}
                  value={age}
                  setValue={setAge}
                  items={ageItems}
                  placeholder="Select Age"
                  style={styles.dropdownStyle}
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
          </View>

          {/* Save button wrapped in container */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#8b5cf6",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#8b5cf6",
    padding: 10,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledInput: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  inputNoBorder: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdown: {
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemText: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  itemSubText: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  saveButton: {
    borderRadius: 16,
    marginTop: 12,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  dropdownWrapper: {
    position: "relative",
  },
  dropdownStyle: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    minHeight: 50,
    paddingHorizontal: 14,
  },
  dropdownText: {
    fontSize: 15,
    color: "#1e293b",
  },
  dropDownContainer: {
    borderColor: "#e2e8f0",
    borderWidth: 1.5,
    borderRadius: 12,
    maxHeight: 200,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    backgroundColor: "#fff",
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  roleActive: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },
  roleText: {
    color: "#1e293b",
    fontWeight: "600",
    fontSize: 14,
  },
  roleTextActive: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
