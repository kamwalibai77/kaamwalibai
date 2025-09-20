// app/screens/HomeScreen.tsx
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
  Modal,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTab from "@/components/BottomTabs";
import serviceTypesApi from "../services/serviceTypes";
import providersApi from "../services/serviceProviders";
import userApi from "../services/user"; // ✅ NEW API for subscription

const { width } = Dimensions.get("window");

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

export default function HomeScreen() {
  const router = useRouter();

  const [selectedArea, setSelectedArea] = useState("Trimurti Nagar");
  const [searchQuery, setSearchQuery] = useState("");
  const [providers, setProviders] = useState([] as any[]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serviceTypes, setServiceTypes] = useState([{ name: "", icon: "" }]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/screens/LoginScreen");
  };

  const fetchServiceTypes = async () => {
    try {
      const response = await serviceTypesApi.getAll();
      const data = await response.data;
      setServiceTypes(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async (reset = false) => {
    try {
      setLoading(true);

      const response = await providersApi.getAllServices({
        page: reset ? 1 : page,
        limit: 6,
        search: searchQuery,
        area: selectedArea,
      });

      const data = response.data;

      if (reset) {
        setProviders(data.data);
      } else {
        setProviders((prev) => [...prev, ...data.data]);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (err) {
      console.log("❌ Error fetching providers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = serviceTypes.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchProviders(true);
    fetchServiceTypes();

    // fetch subscription status
    AsyncStorage.getItem("isSubscribed").then((res) => {
      setIsSubscribed(res === "true");
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProviders(true);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedArea]);

  useEffect(() => {
    if (page > 1) fetchProviders();
  }, [page]);

  const openProviderModal = (provider: any) => {
    setSelectedProvider(provider);

    if (isSubscribed) {
      setModalVisible(true);
    } else {
      setSubscriptionModalVisible(true); // show subscription warning modal
    }
  };

  // ✅ Handle Subscribe / Free Trial
  const handleSubscribe = async () => {
    try {
      const res = await userApi.subscribe(); // ✅ no ID here
      if (res.success) {
        await AsyncStorage.setItem("isSubscribed", "true");
        setIsSubscribed(true);
        setSubscriptionModalVisible(false);
        Alert.alert("✅ Success", "You are now subscribed!");
        setModalVisible(true);
      }
    } catch (err) {
      console.log("❌ Subscription error:", err);
      Alert.alert("Error", "Unable to subscribe. Please try again.");
    }
  };

  const renderProvider = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.providerCard}
      onPress={() => openProviderModal(item)}
    >
      <Image
        source={{ uri: item.provider.profilePhoto }}
        style={styles.providerImage}
        resizeMode="cover"
      />
      <Text style={styles.providerName} numberOfLines={1}>
        {item.provider.name}
      </Text>
      <Text style={styles.providerService} numberOfLines={1}>
        {item.serviceTypeIds.join(", ")}
      </Text>
      <Text style={styles.providerArea} numberOfLines={1}>
        {item.address}
      </Text>
      <Text>{`${item.amount} ${item.currency}/${item.rateType}`}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kaamwalibai</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* AREA FILTER */}
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

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Find Services"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      {/* PROVIDERS LIST */}
      <ScrollView showsVerticalScrollIndicator={false}>
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
          data={providers}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          scrollEnabled={false}
          renderItem={renderProvider}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : hasMore ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setPage((prev) => prev + 1)}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </ScrollView>

      {/* SUBSCRIPTION MODAL */}
      <Modal
        visible={subscriptionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSubscriptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 15 }}>
              ⚠️ Get Subscription to View Details
            </Text>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={handleSubscribe}
            >
              <Text style={styles.subscribeText}>Start Free Trial</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeButton, { marginTop: 10 }]}
              onPress={() => setSubscriptionModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PROVIDER INFO MODAL */}
      {selectedProvider && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedProvider.provider.profilePhoto }}
                style={styles.modalImage}
              />
              <Text style={styles.modalName}>
                {selectedProvider.provider.name}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <Text style={styles.modalNumber}>
                  {selectedProvider?.provider?.phone || "N/A"}
                </Text>

                <TouchableOpacity
                  style={{ marginLeft: 15 }}
                  onPress={() => {
                    const phone = selectedProvider?.provider?.phone;
                    if (phone) Linking.openURL(`tel:${phone}`);
                  }}
                >
                  <Ionicons name="call-outline" size={24} color="#4ade80" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginLeft: 15 }}
                  onPress={() => {
                    const phone = selectedProvider?.provider?.phone;
                    if (phone) Linking.openURL(`sms:${phone}`);
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={24}
                    color="#3b82f6"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* BOTTOM TABS */}
      <BottomTab />
    </View>
  );
}

// ...styles remain unchanged

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
    width: width * 0.175,
    height: width * 0.2,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    elevation: 3,
  },
  serviceIcon: {
    width: width * 0.12,
    height: width * 0.12,
    marginBottom: 8,
    borderRadius: (width * 0.12) / 2,
  },
  serviceName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  providerCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    marginHorizontal: 7,
    width: (width - 60) / 2,
    height: (width - 60) / 2 + 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 2,
  },
  providerImage: {
    width: "100%",
    height: "65%",
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
  loadMoreBtn: { padding: 10, alignItems: "center", justifyContent: "center" },
  loadMoreText: { color: "#6366f1", fontWeight: "600" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 15 },
  modalName: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalNumber: { fontSize: 16, color: "#64748b" },
  subscribeButton: {
    backgroundColor: "#facc15",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 15,
  },
  subscribeText: { color: "#1e293b", fontWeight: "600" },
  closeButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 10,
  },
});
