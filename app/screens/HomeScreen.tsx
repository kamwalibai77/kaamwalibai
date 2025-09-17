import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker"; // dropdown
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTab from "@/components/BottomTabs";
import serviceTypes from "../services/serviceTypes";

const { width } = Dimensions.get("window");

// Sample areas of Nagpur
const nagpurAreas = [
  "Trimurti Nagar",
  "Dharampeth",
  "Sitabuldi",
  "Civil Lines",
  "Pratap Nagar",
  "Bajaj Nagar",
  "Mahal",
  "Ambazari",
  "Sadar",
  "Jaripatka",
];

// HomeScreen.tsx
// ... (imports stay same)

const providers = [
  {
    id: "1",
    name: "Sita Bai",
    service: "Cooking",
    area: "Trimurti Nagar",
    rating: 4.5,
    image: "https://cdn-icons-png.flaticon.com/128/1999/1999625.png",
  },
  {
    id: "2",
    name: "Ganga Bai",
    service: "Cleaning",
    area: "Pratap Nagar",
    rating: 4.7,
    image: "https://cdn-icons-png.flaticon.com/128/1999/1999625.png",
  },
  {
    id: "3",
    name: "Radha Bai",
    service: "Laundry",
    area: "Dharampeth",
    rating: 4.3,
    image: "https://cdn-icons-png.flaticon.com/128/1999/1999625.png",
  },
  {
    id: "4",
    name: "Meera Bai",
    service: "Baby Care",
    area: "Sitabuldi",
    rating: 4.8,
    image: "https://cdn-icons-png.flaticon.com/128/1999/1999625.png",
  },
];

// services array (same as before)

export default function HomeScreen() {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState("Trimurti Nagar");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([{ name: "", icon: "" }]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/screens/LoginScreen");
  };

  const filteredProviders = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const response = await serviceTypes.getAll();
        const data = await response.data;
        setServices(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceTypes();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // 🔥 filter both services + providers
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kaamwalibai</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* 🔎 Location Filter */}
      <View style={styles.filterContainer}>
        <Ionicons name="location-outline" size={20} color="#6366f1" />
        <Picker
          selectedValue={selectedArea}
          style={styles.dropdown}
          onValueChange={(itemValue) => setSelectedArea(itemValue)}
        >
          {nagpurAreas.map((area) => (
            <Picker.Item key={area} label={area} value={area} />
          ))}
        </Picker>
      </View>

      {/* 🔎 Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Services or Providers..."
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Services */}
        <Text style={styles.sectionTitle}>Services</Text>
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.serviceCard}>
              <Image source={{ uri: item.icon }} style={styles.serviceIcon} />
              <Text style={styles.serviceName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        <Text style={styles.sectionTitle}>Nearby Providers</Text>
        <FlatList
          data={filteredProviders}
          keyExtractor={(item) => item.id}
          numColumns={2} // 👈 two-column grid
          columnWrapperStyle={{ justifyContent: "space-between" }}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.providerCard}>
              <Image
                source={{ uri: item.image }}
                style={styles.providerImage}
                resizeMode="cover"
              />
              <Text style={styles.providerName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.providerService} numberOfLines={1}>
                {item.service}
              </Text>
              <Text style={styles.providerArea} numberOfLines={1}>
                {item.area}
              </Text>
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={14} color="#fbbf24" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
          )}
        />
      </ScrollView>

      {/* Bottom Tabs (same as before) */}
      <BottomTab />
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#eef2ff",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    elevation: 3,
  },
  dropdown: { flex: 1, height: 40 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    elevation: 3,
  },
  searchInput: { flex: 1, height: 40, marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", margin: 15 },
  serviceCard: {
    width: width * 0.25,
    height: width * 0.3,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    elevation: 3,
  },
  serviceIcon: { width: width * 0.12, height: width * 0.12, marginBottom: 8 },
  serviceName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  providerCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    marginHorizontal: 7, // ✅ spacing on both sides
    width: (width - 60) / 2, // ✅ consistent spacing (30px total padding + 2 * 15 gap)
    height: (width - 60) / 2 + 40, // ✅ square-like look + extra space for text
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 2,
  },
  providerImage: {
    width: "100%",
    height: "65%", // ✅ square feel, top image takes most of card
    borderRadius: 12,
    marginBottom: 8,
  },
  providerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  providerService: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6366f1",
    textAlign: "center",
  },
  providerArea: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 4,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },

  ratingText: {
    marginLeft: 3,
    fontWeight: "600",
    color: "#92400e",
    fontSize: 12,
  },
});
