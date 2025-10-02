import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { API_BASE_URL } from "../utills/config";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BottomTabs from "@/components/BottomTabs";

const { width } = Dimensions.get("window");

export default function SubscriptionScreen() {
  const [selectedRole, setSelectedRole] = useState<"user" | "provider">("user");
  const [purchasedPlan, setPurchasedPlan] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // new

  const userPlans: {
    id: number;
    price: string;
    contacts?: number;
    duration: string;
  }[] = [
    { id: 1, price: "₹99", contacts: 3, duration: "7 Days" },
    { id: 2, price: "₹199", contacts: 10, duration: "15 Days" },
    { id: 3, price: "₹299", contacts: 20, duration: "30 Days" },
    { id: 4, price: "₹499", contacts: 50, duration: "45 Days" },
  ];

  const providerPlans = [
    { id: 1, price: "₹399", duration: "1 Month" },
    { id: 2, price: "₹999", duration: "6 Months" },
    { id: 3, price: "₹1799", duration: "12 Months" },
    { id: 4, price: "₹2499", duration: "18 Months" },
  ];

  const plans = selectedRole === "user" ? userPlans : providerPlans;

  useEffect(() => {
    const load = async () => {
      try {
        const plan = await AsyncStorage.getItem("purchasedPlan");
        if (plan) setPurchasedPlan(plan);

        const uid = await AsyncStorage.getItem("userId"); // load user id
        if (uid) setUserId(uid);
      } catch (e) {
        console.warn("Failed to read from storage", e);
      }
    };
    load();
  }, []);

  const loadRazorpayScript = () => {
    if (Platform.OS !== "web") return Promise.resolve(false);
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fallbackToPaymentLink = async (plan: any) => {
    try {
      const numeric = Number(String(plan.price).replace(/[^0-9]/g, ""));
      if (Number.isNaN(numeric) || numeric <= 0) {
        Alert.alert("Invalid amount");
        return;
      }
      let resp: Response | null = null;
      const token = await AsyncStorage.getItem("token");
      if (token) {
        resp = await fetch(`${API_BASE_URL}/payments/create-link/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: numeric,
            currency: "INR",
            notes: { role: selectedRole, plan: plan.duration, user_id: userId },
          }),
        });
      }

      if (!resp) {
        resp = await fetch(`${API_BASE_URL}/payments/create-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numeric,
            currency: "INR",
            notes: { role: selectedRole, plan: plan.duration, user_id: userId },
          }),
        });
      }

      const json = await resp.json();
      if (!resp.ok || !json.link) {
        Alert.alert(
          "Payment Error",
          json?.error || "Failed to create payment link"
        );
        return;
      }

      try {
        await WebBrowser.openBrowserAsync(json.link);
      } catch {
        Linking.openURL(json.link).catch(() =>
          Alert.alert("Failed to open payment link")
        );
      }
    } catch (err) {
      console.error("payment link error", err);
      Alert.alert("Payment Error", "Failed to initiate payment");
    }
  };

  const handleSubscribe = async (plan: any) => {
    const saveSubscription = async (paymentId: string) => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/payments/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            plan_id: plan.id,
            amount: Number(String(plan.price).replace(/[^0-9]/g, "")),
          }),
        });
        const json = await res.json();
        if (res.ok) console.log("Subscription saved on backend:", json);
        else console.warn("Failed to save subscription:", json);
      } catch (err) {
        console.error("Error saving subscription:", err);
      }
    };

    // Web SDK
    if (Platform.OS === "web") {
      const res = await loadRazorpayScript();
      if (!res) return alert("Razorpay SDK failed to load");

      const options = {
        key: "rzp_test_RMakN5bfeyuqEe",
        amount: Number(String(plan.price).replace(/[^0-9]/g, "")) * 100,
        currency: "INR",
        name: "Maid Service App",
        description: `Subscription for ${plan.duration}`,
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        notes: {
          role: selectedRole,
          plan: plan.duration,
          user_id: userId || "guest",
        }, // updated
        theme: { color: "#6366f1" },
        handler: async (response: any) => {
          alert(
            "Payment Successful! Payment ID: " + response.razorpay_payment_id
          );
          AsyncStorage.setItem("purchasedPlan", plan.duration).catch(() => {});
          setPurchasedPlan(plan.duration);

          await saveSubscription(response.razorpay_payment_id);
        },
      };

      const paymentObject: any = new (window as any).Razorpay(options);
      paymentObject.open();
      return;
    }

    // Native SDK
    try {
      const Razorpay = require("react-native-razorpay");
      if (Razorpay) {
        const amount = Number(String(plan.price).replace(/[^0-9]/g, "")) * 100;
        const optionsNative: any = {
          description: `Subscription for ${plan.duration}`,
          currency: "INR",
          key: "rzp_test_RMakN5bfeyuqEe",
          amount: String(amount),
          name: "Maid Service App",
          prefill: {
            email: "test@example.com",
            contact: "9999999999",
            name: "Test User",
          },
          notes: {
            role: selectedRole,
            plan: plan.duration,
            user_id: userId || "guest",
          }, // updated
          theme: { color: "#6366f1" },
        };

        const rzp = new Razorpay(optionsNative);
        rzp
          .open()
          .then(async (payment: any) => {
            Alert.alert(
              "Payment Successful",
              `Payment ID: ${payment.razorpay_payment_id}`
            );
            AsyncStorage.setItem("purchasedPlan", plan.duration).catch(
              () => {}
            );
            setPurchasedPlan(plan.duration);

            await saveSubscription(payment.razorpay_payment_id);
          })
          .catch((err: any) => {
            console.warn("Native Razorpay error:", err);
            fallbackToPaymentLink(plan).catch(() => {});
          });
        return;
      }
    } catch (e) {
      console.warn(
        "react-native-razorpay not available, falling back to payment link",
        e
      );
    }

    // Fallback to server payment link
    await fallbackToPaymentLink(plan);
  };

  return (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={{ flex: 1 }}>
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {plans.map((plan) => (
          <View key={plan.id} style={styles.card}>
            <Text style={styles.price}>{plan.price}</Text>
            {selectedRole === "user" ? (
              <Text style={styles.details}>
                {(plan as any).contacts ?? 0} Contacts • {plan.duration}
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
        ))}
      </ScrollView>

      <BottomTabs />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
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
  scroll: { padding: 20, alignItems: "center" },
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
