// app/screens/HomeScreen.tsx
import BottomTab from "@/components/BottomTabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../services/api"; // ✅ for maps/suggest API
import providersApi from "../services/serviceProviders";
import serviceTypesApi from "../services/serviceTypes";
import userApi from "../services/user";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
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

  // ✅ NEW: for location search suggestions
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    if (typeof navigation !== "undefined") {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
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
      setSubscriptionModalVisible(true);
    }
  };

  const handleSubscribe = async () => {
    try {
      const res = await userApi.subscribe();
      if (res.data.success) {
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

  // ✅ NEW: fetch location suggestions
  const fetchSuggestions = async (text: string) => {
    setLocationQuery(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await api.get("profile/maps/suggest", {
        params: { query: text },
      });
      setSuggestions(res.data.suggestedLocations || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // ✅ select location
  const handleSelectAddress = (item: any) => {
    setLocationQuery(item.placeName);
    setSelectedArea(item.placeName);
    setSuggestions([]);
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
        {item.serviceTypes.map((st: any) => st.name).join(", ")}
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
        <Text style={styles.headerTitle}>कामवाली बाई</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* ✅ NEW: Location Search Filter */}
      <View style={styles.searchContainer}>
        <Ionicons name="location-outline" size={20} color="gray" />
        <TextInput
          style={styles.searchInput}
          value={locationQuery}
          placeholder="Search city, area or locality"
          onChangeText={fetchSuggestions}
        />
      </View>

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelectAddress(item)}
            >
              <Text style={styles.suggestionText}>{item.placeName}</Text>
              <Text style={styles.suggestionSubText}>
                {item.placeAddress || ""}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionDropdown}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* SEARCH SERVICES */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Find Services"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      {/* Service Type LIST + Providers
          Use a single vertical FlatList for providers and render the
          horizontal services list inside ListHeaderComponent. This avoids
          nesting VirtualizedLists inside a ScrollView which causes the
          runtime warning and breaks windowing. */}
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={renderProvider}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            <Text style={styles.sectionTitle}>Services</Text>

            <FlatList
              data={filteredServices}
              keyExtractor={(item) => item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.serviceCard}>
                  {item.icon ? (
                    <Image
                      source={{ uri: item.icon }}
                      style={styles.serviceIcon}
                    />
                  ) : (
                    <View
                      style={[
                        styles.serviceIcon,
                        {
                          backgroundColor: "#f1f5f9",
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Ionicons name="construct" size={20} color="#94a3b8" />
                    </View>
                  )}
                  <Text style={styles.serviceName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.sectionTitle}>Nearby Providers</Text>
          </>
        )}
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
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 25,
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 5 },
                shadowRadius: 10,
                elevation: 10,
              }}
            >
              {/* Profile Image */}
              <Image
                source={{ uri: selectedProvider.provider.profilePhoto }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 3,
                  borderColor: "#6366f1",
                  marginBottom: 15,
                }}
              />

              {/* Name */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#1e293b",
                  marginBottom: 5,
                }}
              >
                {selectedProvider.provider.name}
              </Text>

              {/* Service Type */}
              <Text
                style={{
                  fontSize: 14,
                  color: "#4b5563",
                  marginBottom: 15,
                  textAlign: "center",
                }}
              >
                {selectedProvider.serviceTypes
                  .map((st: any) => st.name)
                  .join(", ")}
              </Text>

              {/* Contact Box */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#eef2ff",
                  borderRadius: 12,
                  padding: 15,
                  justifyContent: "space-around",
                  width: "100%",
                  marginBottom: 20,
                }}
              >
                {/* Phone */}
                <TouchableOpacity
                  style={{
                    alignItems: "center",
                  }}
                  onPress={() => {
                    const phone = selectedProvider.provider.phoneNumber;
                    if (phone) Linking.openURL(`tel:${phone}`);
                  }}
                >
                  <Ionicons name="call-outline" size={28} color="#4ade80" />
                  <Text
                    style={{
                      marginTop: 5,
                      color: "#065f46",
                      fontWeight: "600",
                    }}
                  >
                    Call
                  </Text>
                </TouchableOpacity>

                {/* Message */}
                <TouchableOpacity
                  style={{
                    alignItems: "center",
                  }}
                  onPress={() => {
                    // Close modal first
                    setModalVisible(false);

                    // Redirect to ChatBoxScreen with provider's ID and name
                    navigation.navigate("ChatBox", {
                      userId: selectedProvider.provider.id,
                      name: selectedProvider.provider.name,
                    });
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={28}
                    color="#3b82f6"
                  />
                  <Text
                    style={{
                      marginTop: 5,
                      color: "#1e40af",
                      fontWeight: "600",
                    }}
                  >
                    Message
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: "#6366f1",
                  paddingVertical: 10,
                  paddingHorizontal: 40,
                  borderRadius: 12,
                }}
                onPress={() => setModalVisible(false)}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                >
                  Close
                </Text>
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
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#6a1010ff" },
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
    width: "80%",
    height: "65%",
    borderRadius: 50,
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
  // ✅ suggestion styles
  suggestionDropdown: {
    maxHeight: 200,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 3,
  },
  suggestionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 10,
  },
  suggestionText: { fontSize: 15, fontWeight: "500", color: "#1e293b" },
  suggestionSubText: { fontSize: 12, color: "gray" },
});
