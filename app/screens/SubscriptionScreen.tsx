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
      {/* ✅ Header same style as ChatScreen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          {/* <Ionicons name="arrow-back" size={28} color="#4f46e5" /> */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.container}>
        <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={{ flex: 1 }}>
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
                  name="person-outline"
                  size={20}
                  color={selectedRole === "user" ? "#fff" : "#6366f1"}
                />
                <Text
                  style={[
                    styles.toggleText,
                    selectedRole === "user" && styles.toggleTextActive,
                  ]}
                >
                  User
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
                  name="briefcase-outline"
                  size={20}
                  color={selectedRole === "provider" ? "#fff" : "#6366f1"}
                />
                <Text
                  style={[
                    styles.toggleText,
                    selectedRole === "provider" && styles.toggleTextActive,
                  ]}
                >
                  Service Provider
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Plans */}
          <ScrollView contentContainerStyle={styles.scroll}>
            {subscriptionDetails && (
              <View
                style={[
                  styles.card,
                  { borderWidth: 1, borderColor: "#e6eefc" },
                ]}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "700", marginBottom: 6 }}
                >
                  Your Subscription
                </Text>
                <Text style={{ fontSize: 14, color: "#334155" }}>
                  {subscriptionDetails.plan?.name ||
                    subscriptionDetails.plan?.duration ||
                    "Custom Plan"}
                </Text>
                <Text style={{ marginTop: 8, color: "#065f46" }}>
                  {subscriptionDetails.remainingContacts != null
                    ? `${subscriptionDetails.remainingContacts} contacts remaining`
                    : "Contacts: N/A"}
                </Text>
                <Text style={{ marginTop: 6, color: "#0f172a" }}>
                  {subscriptionDetails.remainingDays != null
                    ? `${subscriptionDetails.remainingDays} days remaining`
                    : "Expiry: N/A"}
                </Text>
              </View>
            )}

            {plansLoading ? (
              <Text style={{ marginTop: 40 }}>Loading plans…</Text>
            ) : plansError ? (
              <View style={{ alignItems: "center", marginTop: 30 }}>
                <Text style={{ color: "#ef4444", marginBottom: 8 }}>
                  {plansError}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: "#ddd", paddingVertical: 10 },
                  ]}
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
                  <Text style={{ fontWeight: "700" }}>Retry</Text>
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
                    <Text style={styles.price}>{plan.price}</Text>
                    {selectedRole === "user" ? (
                      <Text style={styles.details}>
                        {plan.contacts ?? 0} Contacts • {plan.duration}
                      </Text>
                    ) : (
                      <Text style={styles.details}>{plan.duration}</Text>
                    )}

                    {purchasedPlan === plan.duration ? (
                      <Text style={{ color: "green", fontWeight: "700" }}>
                        Purchased ✅
                      </Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={() => handleSubscribe(plan)}
                      >
                        <LinearGradient
                          colors={["#6366f1", "#4f46e5"]}
                          style={styles.subscribeGradient}
                        >
                          <Text style={styles.subscribeText}>Subscribe</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
            )}
          </ScrollView>
        </LinearGradient>

        {/* ✅ BottomTab exactly like ChatScreen */}
        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#4f46e5" },

  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#6366f1",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginHorizontal: 6,
    backgroundColor: "#fff",
  },
  toggleActive: { backgroundColor: "#6366f1" },
  toggleText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#6366f1",
  },
  toggleTextActive: { color: "#fff", fontWeight: "700" },
  scroll: { padding: 20, alignItems: "center", paddingBottom: 100 },
  card: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  price: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4f46e5",
    marginBottom: 6,
  },
  details: {
    fontSize: 16,
    color: "#334155",
    marginBottom: 16,
    textAlign: "center",
  },
  subscribeButton: { width: "100%", borderRadius: 25, overflow: "hidden" },
  subscribeGradient: {
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  subscribeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
