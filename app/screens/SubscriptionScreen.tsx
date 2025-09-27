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
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BottomTabs from "@/components/BottomTabs";

const { width } = Dimensions.get("window");

export default function SubscriptionScreen() {
  const [selectedRole, setSelectedRole] = useState<"user" | "provider">("user");
  const [purchasedPlan, setPurchasedPlan] = useState<string | null>(null);

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
      } catch (e) {
        console.warn("Failed to read purchasedPlan from storage", e);
      }
    };
    load();
  }, []);

  const loadRazorpayScript = () => {
    // Razorpay flow is web-only. Prevent calling web DOM APIs on native platforms.
    if (Platform.OS !== "web") return Promise.resolve(false);
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: any) => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load");
      return;
    }

    const options = {
      key: "rzp_test_RMakN5bfeyuqEe",
      amount: parseInt(plan.price.replace("₹", "")) * 100,
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
      },
      theme: { color: "#6366f1" },
      handler: function (response: any) {
        alert(
          "Payment Successful! Payment ID: " + response.razorpay_payment_id
        );
        AsyncStorage.setItem("purchasedPlan", plan.duration).catch(() => {});
        setPurchasedPlan(plan.duration);
      },
    };

    const paymentObject: any = new (window as any).Razorpay(options);
    paymentObject.open();
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
  toggleActive: {
    backgroundColor: "#6366f1",
  },
  toggleText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#6366f1",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  scroll: {
    padding: 20,
    alignItems: "center",
  },
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
  subscribeButton: {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
  },
  subscribeGradient: {
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  subscribeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
