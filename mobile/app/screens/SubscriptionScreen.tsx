import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";
import api from "../services/api";
import payments from "../services/payments";

const { width } = Dimensions.get("window");

export default function SubscriptionScreen({ navigation }: any) {
  const [selectedRole, setSelectedRole] = useState<"user" | "provider">("user");
  const [purchasedPlan, setPurchasedPlan] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [plans, setPlans] = useState<any[] | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    plan?: any;
    remainingDays?: number | null;
    remainingContacts?: number | null;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        }
        if (storedRole) {
          setRole(storedRole);
          const compact = (storedRole || "")
            .replace(/[^a-zA-Z]/g, "")
            .toLowerCase();
          if (
            compact === "serviceprovider" ||
            compact === "provider" ||
            compact.includes("service")
          ) {
            setSelectedRole("provider");
          } else {
            setSelectedRole("user");
          }
        }
      } catch (e) {
        console.warn("Failed to read role from storage", e);
      }
    };
    load();

    // Fetch plans from server only — no local fallback
    (async () => {
      setPlansLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await api.get(`/plans`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res && res.data) {
          setPlans(res.data || []);
          setPlansError(null);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error("Failed to fetch plans from server:", err);
        setPlansError("Failed to load plans. Please try again.");
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    })();

    // Fetch user's current subscription from server (if authenticated)
    (async () => {
      setSubLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const r = await api.get("/payments/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r && r.data && r.data.subscription) {
            setUserSubscription(r.data.subscription);
            // find matching plan to mark purchasedPlan (string used in UI)
            const sub = r.data.subscription;
            if (sub && sub.plan_id && plans) {
              const match = (plans || []).find(
                (p) => String(p.id) === String(sub.plan_id)
              );
              if (match)
                setPurchasedPlan(
                  match.duration || match.name || String(match.id)
                );
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user subscription:", e);
      } finally {
        setSubLoading(false);
      }
    })();
  }, []);

  // Recompute subscription details when plans or userSubscription change
  useEffect(() => {
    if (!userSubscription || !plans) {
      setSubscriptionDetails(null);
      return;
    }

    const plan = (plans || []).find(
      (p) => String(p.id) === String(userSubscription.plan_id)
    );
    let remainingDays: number | null = null;
    let remainingContacts: number | null = null;

    if (userSubscription.end_date) {
      const end = new Date(userSubscription.end_date);
      const diff = Math.ceil(
        (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      remainingDays = diff > 0 ? diff : 0;
    }

    if (
      typeof userSubscription.numberOfContacts !== "undefined" &&
      userSubscription.numberOfContacts !== null
    ) {
      remainingContacts = Number(userSubscription.numberOfContacts);
    } else if (plan && typeof plan.contacts !== "undefined") {
      remainingContacts = plan.contacts;
    }

    setSubscriptionDetails({ plan, remainingDays, remainingContacts });
  }, [plans, userSubscription]);

  // Server-driven payment flow: create-hosted-link and poll for webhook-driven subscription
  const createPaymentLink = async (plan: any) => {
    try {
      const numeric = Number(String(plan.price).replace(/[^0-9]/g, ""));
      if (Number.isNaN(numeric) || numeric <= 0) {
        Alert.alert("Invalid amount");
        return null;
      }
      const link = await payments.createPaymentLinkForUser(numeric, {
        role: selectedRole,
        plan: plan.id,
        user: userId,
      });
      return link;
    } catch (err) {
      console.error("createPaymentLink error", err);
      Alert.alert("Payment Error", "Failed to initiate payment");
      return null;
    }
  };

  const saveSubscription = async (paymentId: string, plan: any) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const numeric = Number(String(plan.price).replace(/[^0-9]/g, ""));
      // We avoid client-side verification. Server webhook should mark subscription active.
      // Optionally, keep a lightweight server record if needed by calling /user/subscriptions
      // But typically the webhook will create the Subscription record.
    } catch (err) {
      console.error("Error saving subscription:", err);
    }
  };
  const handleSubscribe = async (plan: any) => {
    // Create hosted payment link and open it. Webhook will mark subscription when payment completes.
    const link = await createPaymentLink(plan);
    if (!link) return;

    try {
      await WebBrowser.openBrowserAsync(link);
    } catch {
      Linking.openURL(link).catch(() =>
        Alert.alert("Failed to open payment link")
      );
    }

    // Poll /payments/me for the subscription to be created by webhook
    const token = await AsyncStorage.getItem("token");
    const maxAttempts = 12; // 1 minute if delay=5s
    const delayMs = 5000;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, delayMs));
      try {
        const me = await api.get("/payments/me", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (me && me.data && me.data.subscription) {
          setUserSubscription(me.data.subscription);
          const match = (plans || []).find(
            (p) => String(p.id) === String(me.data.subscription.plan_id)
          );
          if (match)
            setPurchasedPlan(match.duration || match.name || String(match.id));
          Alert.alert(
            "Subscription activated",
            "Your subscription is now active."
          );
          return;
        }
      } catch (e) {
        // keep polling
      }
    }

    Alert.alert(
      "Payment submitted",
      "We are processing your payment. If it doesn't appear shortly, please contact support."
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#c084fc"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Plans & Pricing</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="diamond-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
          {/* Toggle: only show when role is not defined (e.g., guest or switchable) */}
          {!role && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedRole === "user" && styles.toggleActive,
                ]}
                onPress={() => setSelectedRole("user")}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={selectedRole === "user" ? "#fff" : "#8b5cf6"}
                />
                <Text
                  style={[
                    styles.toggleText,
                    selectedRole === "user" && styles.toggleTextActive,
                  ]}
                >
                  User Plans
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedRole === "provider" && styles.toggleActive,
                ]}
                onPress={() => setSelectedRole("provider")}
              >
                <Ionicons
                  name="briefcase"
                  size={18}
                  color={selectedRole === "provider" ? "#fff" : "#8b5cf6"}
                />
                <Text
                  style={[
                    styles.toggleText,
                    selectedRole === "provider" && styles.toggleTextActive,
                  ]}
                >
                  Provider Plans
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Plans */}
          <ScrollView contentContainerStyle={styles.scroll}>
            {subscriptionDetails && (
              <LinearGradient
                colors={["#10b981", "#059669", "#047857"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.currentSubCard}
              >
                <View style={styles.glowEffect} />
                <View style={styles.currentSubHeader}>
                  <View style={styles.activeIconWrapper}>
                    <Ionicons
                      name="checkmark-circle"
                      size={32}
                      color="#ffffff"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currentSubTitle}>
                      Active Subscription
                    </Text>
                    <Text style={styles.currentSubPlan}>
                      {subscriptionDetails.plan?.name ||
                        subscriptionDetails.plan?.duration ||
                        "Premium Plan"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.currentSubDetails}>
                  <View style={styles.currentSubDetailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons name="people" size={20} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Contacts</Text>
                      <Text style={styles.detailValue}>
                        {subscriptionDetails.remainingContacts != null
                          ? subscriptionDetails.remainingContacts
                          : "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.currentSubDetailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons name="time" size={20} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Days Left</Text>
                      <Text style={styles.detailValue}>
                        {subscriptionDetails.remainingDays != null
                          ? subscriptionDetails.remainingDays
                          : "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            )}

            {plansLoading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons name="reload-circle" size={64} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyText}>Loading plans...</Text>
              </View>
            ) : plansError ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={64}
                    color="#ef4444"
                  />
                </View>
                <Text style={styles.errorText}>{plansError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={async () => {
                    setPlansLoading(true);
                    setPlansError(null);
                    try {
                      const token = await AsyncStorage.getItem("token");
                      const res = await api.get(`/plans`, {
                        headers: {
                          Authorization: token ? `Bearer ${token}` : "",
                        },
                      });
                      setPlans(res.data || []);
                    } catch (err) {
                      setPlansError("Failed to load plans. Please try again.");
                    } finally {
                      setPlansLoading(false);
                    }
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.plansGrid}>
                {(plans || [])
                  .filter((p) =>
                    selectedRole === "user"
                      ? p.type === "user"
                      : p.type === "provider"
                  )
                  .map((plan, index) => {
                    const isPurchased = purchasedPlan === plan.duration;
                    const isPopular = index === 1; // Mark middle plan as popular

                    return (
                      <View
                        key={plan.id}
                        style={[styles.card, isPopular && styles.popularCard]}
                      >
                        {isPopular && (
                          <View style={styles.popularBadge}>
                            <LinearGradient
                              colors={["#f59e0b", "#d97706"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.popularBadgeGradient}
                            >
                              <Ionicons name="star" size={14} color="#fff" />
                              <Text style={styles.popularBadgeText}>
                                MOST POPULAR
                              </Text>
                            </LinearGradient>
                          </View>
                        )}

                        <LinearGradient
                          colors={
                            isPurchased
                              ? ["#d1fae5", "#ffffff"]
                              : isPopular
                              ? ["#fef3c7", "#ffffff"]
                              : ["#f8fafc", "#ffffff"]
                          }
                          style={styles.cardGradient}
                        >
                          <View style={styles.cardContent}>
                            {/* Plan Icon */}
                            <View
                              style={[
                                styles.planIconWrapper,
                                isPurchased && styles.planIconActive,
                                isPopular && styles.planIconPopular,
                              ]}
                            >
                              <LinearGradient
                                colors={
                                  isPurchased
                                    ? ["#10b981", "#059669"]
                                    : isPopular
                                    ? ["#f59e0b", "#d97706"]
                                    : ["#8b5cf6", "#6366f1"]
                                }
                                style={styles.iconGradient}
                              >
                                <Ionicons
                                  name={
                                    isPurchased
                                      ? "checkmark-circle"
                                      : selectedRole === "user"
                                      ? "person"
                                      : "briefcase"
                                  }
                                  size={24}
                                  color="#ffffff"
                                />
                              </LinearGradient>
                            </View>

                            {/* Plan Title */}
                            <Text style={styles.planDuration}>
                              {plan.duration}
                            </Text>

                            {/* Price */}
                            <View style={styles.priceWrapper}>
                              <Text style={styles.currencySymbol}>₹</Text>
                              <Text style={styles.price}>
                                {plan.price && typeof plan.price === "string"
                                  ? plan.price.replace(/[^\d]/g, "")
                                  : String(plan.price || "0").replace(
                                      /[^\d]/g,
                                      ""
                                    )}
                              </Text>
                            </View>

                            {/* Features List */}
                            <View style={styles.featuresContainer}>
                              {selectedRole === "user" && (
                                <View style={styles.planFeature}>
                                  <View style={styles.featureIconWrapper}>
                                    <Ionicons
                                      name="people"
                                      size={14}
                                      color="#8b5cf6"
                                    />
                                  </View>
                                  <Text style={styles.planFeatureText}>
                                    {plan.contacts ?? 0} Service Contacts
                                  </Text>
                                </View>
                              )}

                              <View style={styles.planFeature}>
                                <View style={styles.featureIconWrapper}>
                                  <Ionicons
                                    name="shield-checkmark"
                                    size={14}
                                    color="#8b5cf6"
                                  />
                                </View>
                                <Text style={styles.planFeatureText}>
                                  Premium Support
                                </Text>
                              </View>

                              <View style={styles.planFeature}>
                                <View style={styles.featureIconWrapper}>
                                  <Ionicons
                                    name="flash"
                                    size={14}
                                    color="#8b5cf6"
                                  />
                                </View>
                                <Text style={styles.planFeatureText}>
                                  Instant Access
                                </Text>
                              </View>
                            </View>

                            {/* Subscribe Button */}
                            {isPurchased ? (
                              <View style={styles.purchasedBadge}>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={16}
                                  color="#10b981"
                                />
                                <Text style={styles.purchasedText}>
                                  Active Plan
                                </Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.subscribeButton}
                                onPress={() => handleSubscribe(plan)}
                              >
                                <LinearGradient
                                  colors={
                                    isPopular
                                      ? ["#f59e0b", "#d97706"]
                                      : ["#8b5cf6", "#6366f1"]
                                  }
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.subscribeGradient}
                                >
                                  <Text style={styles.subscribeText}>
                                    Subscribe Now
                                  </Text>
                                  <Ionicons
                                    name="arrow-forward-circle"
                                    size={16}
                                    color="#fff"
                                  />
                                </LinearGradient>
                              </TouchableOpacity>
                            )}
                          </View>
                        </LinearGradient>
                      </View>
                    );
                  })}
              </View>
            )}
          </ScrollView>
        </View>

        {/* ✅ BottomTab exactly like ChatScreen */}
        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },

  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8b5cf6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 6,
    backgroundColor: "#fff",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleActive: {
    backgroundColor: "#8b5cf6",
    shadowOpacity: 0.3,
    elevation: 4,
  },
  toggleText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#8b5cf6",
  },
  toggleTextActive: { color: "#fff", fontWeight: "700" },

  scroll: {
    padding: 16,
    alignItems: "center",
    paddingBottom: 100,
  },

  plansGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: width - 32,
    paddingHorizontal: 0,
  },

  currentSubCard: {
    width: width * 0.92,
    borderRadius: 24,
    padding: 0,
    marginBottom: 24,
    shadowColor: "#10b981",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
    overflow: "hidden",
  },
  glowEffect: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  currentSubHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  activeIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  currentSubTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  currentSubPlan: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 20,
  },
  currentSubDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  currentSubDetailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  detailIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 2,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 15,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  card: {
    width: (width - 40) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  popularCard: {
    shadowColor: "#f59e0b",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 6,
  },
  popularBadge: {
    position: "absolute",
    top: 12,
    right: -30,
    zIndex: 10,
    transform: [{ rotate: "45deg" }],
  },
  popularBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 30,
    gap: 3,
  },
  popularBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    padding: 12,
    alignItems: "center",
  },
  planIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 8,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  planIconActive: {
    shadowColor: "#10b981",
  },
  planIconPopular: {
    shadowColor: "#f59e0b",
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  planDuration: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8b5cf6",
    marginTop: 1,
    marginRight: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: "800",
    color: "#8b5cf6",
    letterSpacing: -0.5,
  },
  featuresContainer: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    gap: 6,
  },
  planFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  planFeatureText: {
    fontSize: 9,
    color: "#475569",
    fontWeight: "600",
    flex: 1,
  },
  details: {
    fontSize: 16,
    color: "#334155",
    marginBottom: 16,
    textAlign: "center",
  },
  purchasedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: "#10b981",
  },
  purchasedText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subscribeButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  subscribeGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  subscribeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
