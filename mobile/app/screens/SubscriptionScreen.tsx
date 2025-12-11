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
              <View style={styles.currentSubCard}>
                <View style={styles.currentSubHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.currentSubTitle}>
                    Active Subscription
                  </Text>
                </View>
                <Text style={styles.currentSubPlan}>
                  {subscriptionDetails.plan?.name ||
                    subscriptionDetails.plan?.duration ||
                    "Custom Plan"}
                </Text>
                <View style={styles.currentSubDetails}>
                  <View style={styles.currentSubDetailItem}>
                    <Ionicons name="people" size={18} color="#8b5cf6" />
                    <Text style={styles.currentSubDetailText}>
                      {subscriptionDetails.remainingContacts != null
                        ? `${subscriptionDetails.remainingContacts} contacts left`
                        : "Contacts: N/A"}
                    </Text>
                  </View>
                  <View style={styles.currentSubDetailItem}>
                    <Ionicons name="time" size={18} color="#8b5cf6" />
                    <Text style={styles.currentSubDetailText}>
                      {subscriptionDetails.remainingDays != null
                        ? `${subscriptionDetails.remainingDays} days left`
                        : "Expiry: N/A"}
                    </Text>
                  </View>
                </View>
              </View>
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
              (plans || [])
                .filter((p) =>
                  selectedRole === "user"
                    ? p.type === "user"
                    : p.type === "provider"
                )
                .map((plan) => (
                  <View key={plan.id} style={styles.card}>
                    <View style={styles.planIconWrapper}>
                      <Ionicons
                        name={selectedRole === "user" ? "person" : "briefcase"}
                        size={28}
                        color="#8b5cf6"
                      />
                    </View>
                    <Text style={styles.planDuration}>{plan.duration}</Text>
                    <Text style={styles.price}>{plan.price}</Text>
                    {selectedRole === "user" ? (
                      <View style={styles.planFeature}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10b981"
                        />
                        <Text style={styles.planFeatureText}>
                          {plan.contacts ?? 0} Contacts
                        </Text>
                      </View>
                    ) : null}

                    {purchasedPlan === plan.duration ? (
                      <View style={styles.purchasedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#10b981"
                        />
                        <Text style={styles.purchasedText}>Active Plan</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={() => handleSubscribe(plan)}
                      >
                        <LinearGradient
                          colors={["#8b5cf6", "#6366f1"]}
                          style={styles.subscribeGradient}
                        >
                          <Text style={styles.subscribeText}>
                            Subscribe Now
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color="#fff"
                          />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
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
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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

  currentSubCard: {
    width: width * 0.9,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#10b981",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  currentSubHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  currentSubTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
    marginLeft: 8,
  },
  currentSubPlan: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  currentSubDetails: {
    gap: 8,
  },
  currentSubDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  currentSubDetailText: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 8,
    fontWeight: "600",
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
    width: width * 0.9,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  planIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  planDuration: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: "#8b5cf6",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  planFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  planFeatureText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
  },
  purchasedText: {
    color: "#10b981",
    fontSize: 15,
    fontWeight: "700",
  },
  subscribeButton: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 8,
  },
  subscribeGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  subscribeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
