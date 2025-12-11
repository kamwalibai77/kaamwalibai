// app/screens/HomeScreen.tsx
import BottomTab from "@/components/BottomTabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ SafeArea
import io from "socket.io-client";
import api from "../services/api";
import providersApi from "../services/serviceProviders";
import serviceTypesApi from "../services/serviceTypes";
import userApi from "../services/user";
import { SOCKET_URL } from "../utills/config";
const PlaceholderImg = require("../../assets/images/default.png");

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
  const [serviceTypes, setServiceTypes] = useState([
    { id: 0 as number | undefined, name: "", icon: "" },
  ] as Array<{
    id?: number | string;
    name: string;
    icon?: string;
  }>);
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<
    number[]
  >([]);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<
    "all" | "male" | "female"
  >("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerAvgRating, setProviderAvgRating] = useState<number | null>(
    null
  );
  const [ratingLoading, setRatingLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [consumedProviderIds, setConsumedProviderIds] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] =
    useState(false);
  const [subscriptionLimit, setSubscriptionLimit] = useState<number | null>(
    null
  );
  const [subscriptionRemaining, setSubscriptionRemaining] = useState<
    number | null
  >(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const socketRef = React.useRef<any>(null);

  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const initializedRef = React.useRef(false);

  // Offer carousel state
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: screenWidth } = Dimensions.get("window");

  const offers = [
    require("../../assets/images/offer.png"),
    require("../../assets/images/offer2.png"),
    require("../../assets/images/offer3.png"),
    require("../../assets/images/offer4.png"),
  ];

  // Auto-scroll offers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOfferIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % offers.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (screenWidth - 32),
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [offers.length, screenWidth]);

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
        serviceTypeIds: selectedServiceTypeIds,
        gender:
          selectedGenderFilter === "all" ? undefined : selectedGenderFilter,
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

  // If subscriptionLimit is set, show only that many providers
  // Listing should always show providers returned from API; subscription limits
  // only control contact actions (view/call/message). Previously we sliced
  // the providers array when subscriptionLimit was 0 which produced an
  // empty list even though the API returned results.
  const displayedProviders = providers;

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

      // If we couldn't get GPS coords, try to populate from the logged-in user's profile (/users/me)
      if (!coords) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            const me = await api.get("/users/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (me && me.data && me.data.user) {
              const u = me.data.user;
              // prefer profile latitude/longitude when available
              if (u.latitude && u.longitude) {
                coords = { lat: Number(u.latitude), lng: Number(u.longitude) };
                setUserLat(coords.lat);
                setUserLng(coords.lng);
              }
              // populate address / locationQuery
              const addr =
                u.address || u.city || u.region || u.postalCode || null;
              if (addr) {
                setSelectedArea(addr);
                setLocationQuery(addr);
              }
            }
          }
        } catch (e) {
          // ignore profile fetch errors
          console.log("/users/me fetch error", e);
        }
      }

      await fetchProviders(true, coords?.lat ?? null, coords?.lng ?? null, 10);
      // Fetch user's subscription details to enforce contact limits
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const me = await api.get("/payments/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (me && me.data && me.data.subscription) {
            const sub = me.data.subscription;
            // If backend returns remaining contacts as numberOfContacts, use that.
            const remaining =
              typeof sub.numberOfContacts !== "undefined" &&
              sub.numberOfContacts !== null
                ? Number(sub.numberOfContacts)
                : null;
            const limit =
              remaining !== null
                ? remaining
                : sub.plan && sub.plan.contacts
                ? Number(sub.plan.contacts)
                : null;
            setSubscriptionRemaining(remaining);
            setSubscriptionLimit(limit);
            // consider the existence of a subscription as subscribed
            setIsSubscribed(true);
          }
        }
      } catch (e) {
        // ignore; subscription info not critical here
      }
    };
    init();
    fetchServiceTypes();
    AsyncStorage.getItem("isSubscribed").then((res) => {
      // preserve local flag if present; API fetch above may override
      if (res === "true") setIsSubscribed(true);
    });
    initializedRef.current = true;
  }, []);

  // Socket listeners for notification events
  useEffect(() => {
    (async () => {
      const storedId = await AsyncStorage.getItem("userId");
      if (!storedId) return;
      const socket = io(SOCKET_URL, { transports: ["websocket"] });
      socketRef.current = socket;
      socket.on("connect", () => socket.emit("register", storedId));

      socket.on("receiveMessage", (msg: any) => {
        // Only show notification if the message is for this user
        AsyncStorage.getItem("userId").then((myId) => {
          if (String(msg.receiverId) === String(myId)) {
            setNotifications((prev) => [
              {
                id: `msg-${msg.id}`,
                type: "message",
                title: `New message from ${msg.senderName || msg.senderId}`,
                body: msg.message,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        });
      });

      socket.on("subscriptionPurchased", (data: any) => {
        // Only show notification if the event is for this user
        AsyncStorage.getItem("userId").then((myId) => {
          if (String(data.userId) === String(myId)) {
            setNotifications((prev) => [
              {
                id: `sub-${Date.now()}`,
                type: "subscription",
                title: "Subscription purchased",
                body: data?.message || "Your subscription was activated",
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        });
      });

      return () => {
        try {
          socket.disconnect();
        } catch (e) {}
        socketRef.current = null;
      };
    })();
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    const timeout = setTimeout(() => {
      fetchProviders(true);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedArea, userLat, userLng]);

  // Re-fetch when gender filter changes
  useEffect(() => {
    if (!initializedRef.current) return;
    fetchProviders(true);
  }, [selectedGenderFilter]);

  // Re-fetch when selected service types change
  useEffect(() => {
    if (!initializedRef.current) return;
    fetchProviders(true);
  }, [selectedServiceTypeIds]);

  useEffect(() => {
    if (page > 1) fetchProviders();
  }, [page]);

  const openProviderModal = async (provider: any) => {
    // If user has a subscription with remaining count and it's zero, block access
    if (
      isSubscribed &&
      subscriptionRemaining !== null &&
      subscriptionRemaining <= 0
    ) {
      Alert.alert(
        "Subscription limit reached",
        "You have reached your contact limit. Buy a new subscription to contact more providers.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Buy Subscription",
            onPress: () => navigation.navigate("Subscription"),
          },
        ]
      );
      return;
    }

    setSelectedProvider(provider);

    if (!isSubscribed) {
      setSubscriptionModalVisible(true);
      return;
    }

    // If already consumed for this provider (viewed), just open modal
    const pid = provider?.provider?.id ?? provider?.id;
    if (pid && consumedProviderIds.includes(pid)) {
      setModalVisible(true);
      return;
    }

    // Otherwise attempt to consume one 'view' contact before showing details
    if (contactLoading) return; // avoid parallel consumes
    setContactLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await api.post(
        "/payments/consume",
        { provider_id: pid, action: "view" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // update remaining count from server response when present
      const remaining = resp?.data?.remaining;
      setSubscriptionRemaining((prev) =>
        typeof remaining !== "undefined" ? remaining : prev
      );

      // mark this provider as consumed so subsequent Call/Message won't double-consume
      if (pid) setConsumedProviderIds((prev) => [...prev, pid]);

      setModalVisible(true);
    } catch (e) {
      const errMsg =
        (e as any)?.response?.data?.error || "Unable to consume contact";
      if (errMsg === "Subscription contact limit reached") {
        Alert.alert(
          "Subscription limit reached",
          "You have reached your contact limit. Buy a new subscription to contact more providers.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Buy Subscription",
              onPress: () => navigation.navigate("Subscription"),
            },
          ]
        );
      } else {
        console.warn("consume error on view", e);
        Alert.alert("Subscription", errMsg);
      }
    } finally {
      setContactLoading(false);
    }
  };

  // When modal opens fetch average rating for the provider (if available)
  useEffect(() => {
    const fetchAvg = async () => {
      if (!modalVisible || !selectedProvider) return;
      const pid = selectedProvider?.provider?.id ?? selectedProvider?.id;
      if (!pid) return;
      try {
        setRatingLoading(true);
        const res = await api.get(`/rating/avg/${pid}`);
        const avg = res?.data?.avg ?? null;
        setProviderAvgRating(typeof avg === "number" ? avg : Number(avg) || 0);
      } catch (err) {
        console.warn("Failed to fetch avg rating", err);
        setProviderAvgRating(null);
      } finally {
        setRatingLoading(false);
      }
    };
    fetchAvg();
  }, [modalVisible, selectedProvider]);

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
      <View style={styles.providerImageContainer}>
        <Image
          source={getProfileSource(item.provider.profilePhoto)}
          style={styles.providerImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.imageOverlay}
        >
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#10b981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.providerInfo}>
        <Text style={styles.providerName} numberOfLines={1}>
          {item.provider.name}
        </Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= 4 ? "star" : "star-outline"}
              size={9}
              color="#fbbf24"
            />
          ))}
          <Text style={styles.ratingText}>4.5</Text>
        </View>
        <View style={styles.serviceBadge}>
          <MaterialCommunityIcons name="broom" size={9} color="#8b5cf6" />
          <Text style={styles.providerService} numberOfLines={1}>
            {item.serviceTypes.map((st: any) => st.name).join(", ")}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={9} color="#94a3b8" />
          <Text style={styles.providerArea} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <View style={styles.providerPriceRow}>
          <Ionicons name="cash-outline" size={11} color="#8b5cf6" />
          <Text style={styles.providerPrice}>₹{item.amount}</Text>
          <Text style={styles.providerRateType}>/{item.rateType}</Text>
        </View>
      </View>
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
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER WITH GRADIENT */}
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#c084fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>कामवाली बाई</Text>
            <TouchableOpacity
              style={{ marginLeft: "auto", paddingHorizontal: 12 }}
              onPress={() => setNotifModalVisible(true)}
            >
              <View>
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="#ffffff"
                />
                {notifications.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notifications.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Notifications Modal */}
        <Modal visible={notifModalVisible} transparent animationType="slide">
          <View style={styles.notifOverlay}>
            <View style={styles.notifBox}>
              <Text
                style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}
              >
                Notifications
              </Text>
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.notifItem}>
                    <Text style={{ fontWeight: "600" }}>{item.title}</Text>
                    <Text style={{ color: "#555" }}>{item.body}</Text>
                  </View>
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: 12 }}>
                    <Text>No notifications</Text>
                  </View>
                )}
              />
              <TouchableOpacity
                onPress={() => setNotifModalVisible(false)}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: "#2563eb", fontWeight: "700" }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Location Search Filter */}
        <View style={styles.searchContainer}>
          <Ionicons name="location-outline" size={22} color="#8b5cf6" />
          <TextInput
            style={styles.searchInput}
            value={locationQuery}
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
            <Ionicons name="locate-outline" size={24} color="#a855f7" />
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

        {/* Services + Providers */}
        <FlatList
          data={displayedProviders}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 10,
          }}
          renderItem={renderProvider}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }} // ✅ space for BottomTab
          ListHeaderComponent={() => (
            <>
              {/* Services section without label - just clear button if needed */}
              {selectedServiceTypeIds.length > 0 && (
                <View
                  style={[
                    styles.sectionHeaderRow,
                    { marginTop: 4, marginBottom: 2 },
                  ]}
                >
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedServiceTypeIds([]);
                      fetchProviders(true);
                    }}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
              <FlatList
                data={serviceTypes}
                keyExtractor={(item) => item.id?.toString() ?? item.name}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 10,
                  paddingTop: 4,
                  paddingBottom: 4,
                }}
                renderItem={({ item }) => {
                  const id = Number(item.id);
                  const selected = selectedServiceTypeIds.includes(id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.serviceCard,
                        selected && styles.serviceCardSelected,
                      ]}
                      onPress={() => {
                        // toggle selection
                        setSelectedServiceTypeIds((prev) => {
                          if (prev.includes(id))
                            return prev.filter((x) => x !== id);
                          return [...prev, id];
                        });
                      }}
                    >
                      {item.icon ? (
                        <Image
                          source={{ uri: item.icon }}
                          style={styles.serviceIcon}
                        />
                      ) : (
                        <View style={styles.serviceIconPlaceholder}>
                          <Ionicons
                            name="construct"
                            size={24}
                            color="#8b5cf6"
                          />
                        </View>
                      )}
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Advertisement Banner with Carousel - Moved below services */}
              <View style={styles.offerSection}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerHeaderText}>🎉 Special Offers</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Subscription")}
                  >
                    <Text style={styles.viewAllText}>View All →</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  ref={scrollViewRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(
                      event.nativeEvent.contentOffset.x / (screenWidth - 32)
                    );
                    setCurrentOfferIndex(index);
                  }}
                  style={styles.offerCarousel}
                >
                  {offers.map((offer, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.9}
                      onPress={() => {
                        Linking.openURL("https://your-offer-link.example.com");
                      }}
                      style={[styles.offerCard, { width: screenWidth - 32 }]}
                    >
                      <Image
                        source={offer}
                        style={styles.offerImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.dotsContainer}>
                  {offers.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        currentOfferIndex === index && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginHorizontal: 16,
                  marginTop: 4,
                  marginBottom: 6,
                }}
              >
                <Text style={[styles.sectionTitle, { margin: 0 }]}>
                  Nearby Providers
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => setSelectedGenderFilter("all")}
                    style={[
                      styles.genderFilterBtn,
                      selectedGenderFilter === "all" &&
                        styles.genderFilterActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderFilterText,
                        selectedGenderFilter === "all" && { color: "#ffffff" },
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedGenderFilter("male")}
                    style={[
                      styles.genderFilterBtn,
                      selectedGenderFilter === "male" &&
                        styles.genderFilterActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderFilterText,
                        selectedGenderFilter === "male" && { color: "#ffffff" },
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedGenderFilter("female")}
                    style={[
                      styles.genderFilterBtn,
                      selectedGenderFilter === "female" &&
                        styles.genderFilterActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderFilterText,
                        selectedGenderFilter === "female" && {
                          color: "#ffffff",
                        },
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator size="small" color="#a855f7" />
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

                {/* Provider gender and availability + rating */}
                <View style={{ alignSelf: "stretch", marginBottom: 12 }}>
                  <Text style={{ color: "#374151", fontWeight: "600" }}>
                    {selectedProvider.provider.gender
                      ? `Gender: ${selectedProvider.provider.gender}`
                      : ""}
                  </Text>

                  {/* availabilitySlots array if present on service */}
                  {selectedProvider.availabilitySlots && (
                    <Text style={{ color: "#6b7280", marginTop: 6 }}>
                      Available:{" "}
                      {String(selectedProvider.availabilitySlots).replace(
                        /,/g,
                        ", "
                      )}
                    </Text>
                  )}

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ fontWeight: "700", marginRight: 8 }}>
                      Rating:
                    </Text>
                    {ratingLoading ? (
                      <ActivityIndicator size="small" color="#f59e0b" />
                    ) : (
                      <Text style={{ color: "#b45309", fontWeight: "700" }}>
                        {providerAvgRating !== null
                          ? providerAvgRating.toFixed(1)
                          : "—"}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={{
                        marginLeft: 12,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        backgroundColor: "#efefef",
                        borderRadius: 8,
                      }}
                      onPress={async () => {
                        setModalVisible(false);
                        const pid =
                          selectedProvider?.provider?.id ??
                          selectedProvider?.id;
                        try {
                          if (pid)
                            await AsyncStorage.setItem(
                              "selectedProviderId",
                              String(pid)
                            );
                        } catch (e) {
                          console.warn(
                            "Failed to persist selectedProviderId",
                            e
                          );
                        }
                        navigation.navigate("ReveiwForm", {
                          providerId: pid,
                          providerName: selectedProvider?.provider?.name,
                          providerPhoto:
                            selectedProvider?.provider?.profilePhoto,
                        });
                      }}
                    >
                      <Text style={{ fontWeight: "700", color: "#065f46" }}>
                        Rate
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.providerModalActions}>
                  <TouchableOpacity
                    style={{ alignItems: "center" }}
                    disabled={contactLoading}
                    onPress={async () => {
                      if (contactLoading) return;
                      setContactLoading(true);
                      try {
                        // ask server to consume one contact before opening phone
                        const token = await AsyncStorage.getItem("token");
                        await api.post(
                          "/payments/consume",
                          {
                            provider_id: selectedProvider.provider.id,
                            action: "call",
                          },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        const phone = selectedProvider.provider.phoneNumber;
                        if (phone) Linking.openURL(`tel:${phone}`);

                        // update local remaining count to reflect server-side change
                        setSubscriptionRemaining((prev) =>
                          prev !== null ? prev - 1 : null
                        );
                      } catch (e) {
                        console.warn("consume error", e);
                        Alert.alert(
                          "Subscription",
                          (e as any)?.response?.data?.error ||
                            "Unable to consume contact"
                        );
                      } finally {
                        setContactLoading(false);
                      }
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
                      {contactLoading ? "Processing..." : "Call"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ alignItems: "center" }}
                    disabled={contactLoading}
                    onPress={async () => {
                      if (contactLoading) return;
                      setContactLoading(true);
                      try {
                        const token = await AsyncStorage.getItem("token");
                        await api.post(
                          "/payments/consume",
                          {
                            provider_id: selectedProvider.provider.id,
                            action: "message",
                          },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setModalVisible(false);
                        navigation.navigate("ChatBox", {
                          userId: selectedProvider.provider.id,
                          name: selectedProvider.provider.name,
                        });
                        setSubscriptionRemaining((prev) =>
                          prev !== null ? prev - 1 : null
                        );
                      } catch (e) {
                        console.warn("consume error", e);
                        Alert.alert(
                          "Subscription",
                          (e as any)?.response?.data?.error ||
                            "Unable to consume contact"
                        );
                      } finally {
                        setContactLoading(false);
                      }
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
                      {contactLoading ? "Processing..." : "Message"}
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
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: -25,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 2,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  searchInput: { flex: 1, height: 36, marginLeft: 8, fontSize: 14 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    color: "#1e293b",
    letterSpacing: 0.3,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 6,
  },

  badge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: "#ef4444",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  notifOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifBox: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  notifItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },

  clearButton: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  clearButtonText: { color: "#8b5cf6", fontWeight: "800", fontSize: 11 },

  serviceCard: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 68,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    marginVertical: 2,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  serviceCardSelected: {
    backgroundColor: "#eef2ff",
    borderWidth: 2,
    borderColor: "#8b5cf6",
    elevation: 6,
    shadowOpacity: 0.25,
    transform: [{ scale: 1.03 }],
  },
  serviceIcon: { width: 36, height: 36, borderRadius: 18 },
  serviceIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 3,
    fontWeight: "600",
    color: "#475569",
  },
  providerCard: {
    flex: 1,
    margin: 5,
    maxWidth: "44%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  providerImageContainer: {
    width: "100%",
    backgroundColor: "#f8fafc",
    position: "relative",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "35%",
    justifyContent: "flex-end",
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 2,
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#10b981",
    letterSpacing: 0.2,
  },
  providerInfo: {
    padding: 6,
    backgroundColor: "#ffffff",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 1,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 2,
  },
  serviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 2,
  },

  // Offer carousel styles - Modern premium
  offerSection: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  offerHeaderText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 0.3,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8b5cf6",
  },
  offerCarousel: {
    marginBottom: 6,
  },
  offerCard: {
    marginRight: 0,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    elevation: 4,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  offerImage: {
    width: "100%",
    height: 130,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#cbd5e1",
    marginHorizontal: 3,
  },
  activeDot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  adContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  adImage: {
    width: "90%", // narrower than screen
    height: 120, // fixed height
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },

  providerImage: {
    width: "100%",
    aspectRatio: 1.2,
    borderRadius: 0,
  },
  providerName: {
    fontWeight: "800",
    fontSize: 11,
    color: "#1e293b",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  providerService: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "600",
    flex: 1,
  },
  providerArea: {
    fontSize: 8,
    color: "#94a3b8",
    flex: 1,
  },
  providerPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 2,
  },
  providerPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#8b5cf6",
    letterSpacing: 0.3,
  },
  providerRateType: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "600",
  },

  loadMoreBtn: {
    margin: 20,
    padding: 14,
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loadMoreText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },

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
  genderFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 4,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  genderFilterActive: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  genderFilterText: { fontSize: 10, color: "#475569", fontWeight: "700" },
});
