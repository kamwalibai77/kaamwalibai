// app/screens/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// Sample banners
const banners = [
  "https://img.freepik.com/free-vector/cleaning-service-banner_23-2148883815.jpg",
  "https://img.freepik.com/free-vector/home-service-cleaning-banner_23-2148883781.jpg",
  "https://img.freepik.com/free-vector/maid-service-cleaning-banner_23-2148883785.jpg",
];

// Updated services array
const services = [
  {
    name: "Cooking",
    icon: "https://cdn-icons-png.flaticon.com/128/1046/1046784.png",
  },
  {
    name: "Cleaning",
    icon: "https://cdn-icons-png.flaticon.com/128/3075/3075977.png",
  },
  {
    name: "Laundry",
    icon: "https://cdn-icons-png.flaticon.com/128/888/888888.png",
  },
  {
    name: "Utensils",
    icon: "https://cdn-icons-png.flaticon.com/128/1046/1046785.png",
  },
  {
    name: "Home Care",
    icon: "https://cdn-icons-png.flaticon.com/128/3081/3081560.png",
  },
  {
    name: "Baby Care",
    icon: "https://cdn-icons-png.flaticon.com/128/3064/3064197.png",
  },
  {
    name: "Massage Lady",
    icon: "https://cdn-icons-png.flaticon.com/128/2921/2921822.png",
  },
  {
    name: "Caretake",
    icon: "https://cdn-icons-png.flaticon.com/128/1077/1077063.png",
  },
  {
    name: "Gardener",
    icon: "https://cdn-icons-png.flaticon.com/128/616/616408.png",
  },
  {
    name: "Driver",
    icon: "https://cdn-icons-png.flaticon.com/128/685/685352.png",
  },
  {
    name: "Electrician",
    icon: "https://cdn-icons-png.flaticon.com/128/742/742750.png",
  },
  {
    name: "Plumber",
    icon: "https://cdn-icons-png.flaticon.com/128/2921/2921821.png",
  },
  {
    name: "Security Guard",
    icon: "https://cdn-icons-png.flaticon.com/128/3003/3003290.png",
  },
  {
    name: "Beautician",
    icon: "https://cdn-icons-png.flaticon.com/128/2965/2965567.png",
  },
];

// Nearby Indian service providers
const nearby = [
  {
    name: "Anita Sharma",
    service: "Cleaning",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
    distance: "2 km away",
  },
  {
    name: "Ramesh Kumar",
    service: "Cooking",
    img: "https://randomuser.me/api/portraits/men/47.jpg",
    distance: "3 km away",
  },
  {
    name: "Pooja Singh",
    service: "Baby Care",
    img: "https://randomuser.me/api/portraits/women/55.jpg",
    distance: "1.5 km away",
  },
  {
    name: "Vikram Joshi",
    service: "Laundry",
    img: "https://randomuser.me/api/portraits/men/52.jpg",
    distance: "2.5 km away",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/screens/LoginScreen");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hello, Maid Service 👋</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Carousel */}
        {/* <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerContainer}
        >
          {banners.map((b, i) => (
            <Image key={i} source={{ uri: b }} style={styles.bannerImage} />
          ))}
        </ScrollView> */}

        {/* Services Section */}
        <Text style={styles.sectionTitle}>Services</Text>
        <FlatList
          data={services}
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

        {/* Nearby Service Providers */}
        <Text style={styles.sectionTitle}>Nearby Providers</Text>
        <FlatList
          data={nearby}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.nearbyCard}>
              <Image source={{ uri: item.img }} style={styles.nearbyImage} />
              <Text style={styles.nearbyName}>{item.name}</Text>
              <Text style={styles.nearbyService}>{item.service}</Text>
              <Text style={styles.nearbyDistance}>{item.distance}</Text>
            </TouchableOpacity>
          )}
        />
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace("/screens/HomeScreen")}
        >
          <Ionicons name="home" size={24} color="#6366f1" />
          <Text style={[styles.tabText, { color: "#6366f1" }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace("/screens/ChatScreen")}
        >
          <Ionicons name="chatbubbles" size={24} color="#64748b" />
          <Text style={styles.tabText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace("/screens/FindJobScreen")}
        >
          <Ionicons name="briefcase" size={24} color="#64748b" />
          <Text style={styles.tabText}>Find Job</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace("/screens/ProfileScreen")}
        >
          <Ionicons name="person" size={24} color="#64748b" />
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  bannerContainer: { marginTop: 10 },
  bannerImage: {
    width: width * 0.9,
    height: width * 0.4,
    borderRadius: 15,
    marginHorizontal: width * 0.025,
  },
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 5,
    elevation: 3,
  },
  serviceIcon: { width: width * 0.12, height: width * 0.12, marginBottom: 8 },
  serviceName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  nearbyCard: {
    width: width * 0.36,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginRight: 12,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 5,
    elevation: 3,
  },
  nearbyImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: 50,
    marginBottom: 8,
  },
  nearbyName: { fontWeight: "700", fontSize: 14, textAlign: "center" },
  nearbyService: { fontSize: 12, color: "#64748b" },
  nearbyDistance: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 5,
    elevation: 10,
  },
  tabItem: { alignItems: "center" },
  tabText: { fontSize: 12, color: "#64748b", marginTop: 2 },
});
