// app/screens/HomeScreen.tsx
import BottomTab from "@/components/BottomTabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ SafeArea
import api from "../services/api";
import providersApi from "../services/serviceProviders";
import serviceTypesApi from "../services/serviceTypes";
import userApi from "../services/user";
const PlaceholderImg = require("../../assets/images/logo.png");

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [selectedArea, setSelectedArea] = useState("Trimurti Nagar");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
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

  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const initializedRef = React.useRef(false);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const loc = await Location.getCurrentPositionAsync({});
      return {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
    } catch {
      return null;
    }
  };

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

  const fetchProviders = async (
    reset = false,
    explicitLat?: number | null,
    explicitLng?: number | null,
    explicitRadius = 10
  ) => {
    try {
      setLoading(true);
      const response = await providersApi.getAllServices({
        page: reset ? 1 : page,
        limit: 6,
        search: searchQuery,
        area: selectedArea,
        lat: explicitLat ?? userLat ?? undefined,
        lng: explicitLng ?? userLng ?? undefined,
        radius: explicitRadius,
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
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          return;
        }
      } catch {}

      let coords = await getUserLocation();
      if (coords) {
        setUserLat(coords.lat);
        setUserLng(coords.lng);
        try {
          const rev = await Location.reverseGeocodeAsync({
            latitude: coords.lat,
            longitude: coords.lng,
          });
          if (rev && rev.length > 0) {
            const r = rev[0];
            const pretty =
              r.name || r.street || r.city || r.region || r.postalCode;
            if (pretty) setSelectedArea(pretty as string);
          }
        } catch {}
      }

      if (!coords) {
        try {
          const userId = await AsyncStorage.getItem("userId");
          if (userId) {
            const res = await api.get(`/users/${userId}`);
            const u = res.data;
            if (u.latitude && u.longitude) {
              coords = { lat: Number(u.latitude), lng: Number(u.longitude) };
              setUserLat(coords.lat);
              setUserLng(coords.lng);
              setSelectedArea(u.address || selectedArea);
            }
          }
        } catch {}
      }

      await fetchProviders(true, coords?.lat ?? null, coords?.lng ?? null, 10);
      fetchServiceTypes();
    };
    init();

    AsyncStorage.getItem("isSubscribed").then((res) => {
      setIsSubscribed(res === "true");
    });
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    const timeout = setTimeout(() => {
      fetchProviders(true);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedArea, userLat, userLng]);

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
    } catch {
      setSuggestions([]);
    }
  };

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
        source={getProfileSource(item.provider.profilePhoto)}
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
      <Text
        numberOfLines={1}
      >{`${item.amount} ${item.currency}/${item.rateType}`}</Text>
    </TouchableOpacity>
  );

  const getProfileSource = (uri: string | undefined | null) => {
    if (uri && typeof uri === "string" && uri.trim() !== "") return { uri };
    return PlaceholderImg;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>कामवाली बाई</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Location Search Filter */}
        <View style={styles.searchContainer}>
          <Ionicons name="location-outline" size={20} color="gray" />
          <TextInput
            style={styles.searchInput}
            value={locationQuery}
            placeholder="Search city, area or locality"
            onChangeText={fetchSuggestions}
          />
          {/* 📍 Use Current Location Button */}
          <TouchableOpacity
            onPress={async () => {
              let { status } =
                await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Permission denied", "Location access is needed.");
                return;
              }
              let loc = await Location.getCurrentPositionAsync({});
              setUserLat(loc.coords.latitude);
              setUserLng(loc.coords.longitude);

              let [reverse] = await Location.reverseGeocodeAsync(loc.coords);
              if (reverse) {
                const fullAddress = `${reverse.name || ""} ${
                  reverse.street || ""
                }, ${reverse.city || ""}, ${reverse.region || ""}, ${
                  reverse.country || ""
                }`;
                setLocationQuery(fullAddress);
                setSelectedArea(fullAddress);
              }
            }}
          >
            <Ionicons name="locate-outline" size={22} color="#6366f1" />
          </TouchableOpacity>
        </View>
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(_, index) => index.toString()}
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

        {/* Search Services */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Find Services"
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />
        </View>

        {/* Services + Providers */}
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={renderProvider}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }} // ✅ space for BottomTab
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
                      <View style={styles.serviceIconPlaceholder}>
                        <Ionicons name="construct" size={20} color="#94a3b8" />
                      </View>
                    )}
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {item.name}
                    </Text>
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
              <Text
                style={{ fontSize: 16, fontWeight: "600", marginBottom: 15 }}
              >
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
              <View style={styles.providerModal}>
                <Image
                  source={getProfileSource(
                    selectedProvider.provider.profilePhoto
                  )}
                  style={styles.providerModalImage}
                />
                <Text style={styles.providerModalName}>
                  {selectedProvider.provider.name}
                </Text>
                <Text style={styles.providerModalService}>
                  {selectedProvider.serviceTypes
                    .map((st: any) => st.name)
                    .join(", ")}
                </Text>

                <View style={styles.providerModalActions}>
                  <TouchableOpacity
                    style={{ alignItems: "center" }}
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

                  <TouchableOpacity
                    style={{ alignItems: "center" }}
                    onPress={() => {
                      setModalVisible(false);
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

                <TouchableOpacity
                  style={styles.closeModalButton}
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

        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
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
    flex: 1,
    aspectRatio: 1,
    maxWidth: 90,
    backgroundColor: "#fff",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    elevation: 3,
  },
  serviceIcon: { width: 40, height: 40, borderRadius: 20 },
  serviceIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceName: { fontSize: 12, marginTop: 5, textAlign: "center" },

  providerCard: {
    flex: 1,
    margin: 5,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    minWidth: "45%",
  },
  providerImage: { width: "100%", aspectRatio: 1.5, borderRadius: 10 },
  providerName: { fontWeight: "bold", marginTop: 5 },
  providerService: { color: "gray", fontSize: 12 },
  providerArea: { fontSize: 12, marginTop: 2 },

  loadMoreBtn: {
    margin: 20,
    padding: 12,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    alignItems: "center",
  },
  loadMoreText: { color: "#fff", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  subscribeButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  subscribeText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  closeButton: {
    backgroundColor: "#9ca3af",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  providerModal: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  providerModalImage: { width: 100, height: 100, borderRadius: 50 },
  providerModalName: { fontSize: 18, fontWeight: "700", marginVertical: 5 },
  providerModalService: { color: "gray", marginBottom: 15 },
  providerModalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  closeModalButton: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },

  suggestionDropdown: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 10,
    elevation: 3,
    maxHeight: 150,
  },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  suggestionText: { fontSize: 14, fontWeight: "600" },
  suggestionSubText: { fontSize: 12, color: "gray" },
});
