import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../utills/config";

// Payment helper: create a payment link for the authenticated user.
export async function createPaymentLinkForUser(
  amount: number,
  notes: any = {}
) {
  try {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/payments/create-link/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ amount, currency: "INR", notes }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to create link");
    return json.link;
  } catch (err) {
    console.error("createPaymentLinkForUser error:", err);
    throw err;
  }
}

// Deprecated: we intentionally avoid any client-side verification.
// Server-side webhook will mark the subscription active; frontend should poll /payments/me to refresh.

export default { createPaymentLinkForUser };
