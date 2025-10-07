// Change API_BASE_URL to your backend (use LAN IP for device testing)
import { Platform } from "react-native";
import Constants from "expo-constants";

// Host resolution rules:
// 1. If running via Expo/Expo Go during development, Constants.manifest.debuggerHost
//    often contains your machine IP (e.g. "192.168.1.42:19000"). We prefer that.
// 2. If not available, fall back to emulator loopbacks: Android emulator -> 10.0.2.2
//    (Genymotion uses 10.0.3.2). iOS simulator can use localhost.
// 3. For a physical device or a production APK, you should replace HOST below with
//    your machine's LAN IP (e.g. "192.168.1.42") or use a tunnel (ngrok) and point
//    SOCKET_URL/API_BASE_URL to the forwarded address (https://xxx.ngrok.io).

function getHostFromConstants(): string | null {
  try {
    // debuggerHost is like '192.168.1.42:19000'
    const dbg =
      (Constants as any)?.manifest?.debuggerHost ||
      (Constants as any)?.manifest?.packagerOpts?.host;
    if (typeof dbg === "string" && dbg.includes(":")) {
      return dbg.split(":")[0];
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// Manual override: if you want to force a LAN IP or ngrok URL, set this value.
// Example for a physical device: const MANUAL_HOST = "192.168.1.42";
// Example for ngrok (preferred for sharing): const MANUAL_HOST = "abcd-12-34-56-78.ngrok.io";
const MANUAL_HOST: string | null = null;

const inferred =
  (MANUAL_HOST && typeof MANUAL_HOST === "string") || getHostFromConstants();
let HOST: string;

if (inferred) {
  HOST = inferred;
} else if (Platform.OS === "android") {
  // Default emulator loopback for Android emulator
  HOST = "192.168.1.9";
} else {
  HOST = "192.168.1.9";
}

// If MANUAL_HOST is a full host (contains protocol), callers may want to use it directly.
export const API_BASE_URL =
  MANUAL_HOST &&
  typeof MANUAL_HOST === "string" &&
  String(MANUAL_HOST).includes(":")
    ? `${MANUAL_HOST}/api`
    : `http://${HOST}:5000/api`;

export const SOCKET_URL =
  MANUAL_HOST &&
  typeof MANUAL_HOST === "string" &&
  String(MANUAL_HOST).includes(":")
    ? MANUAL_HOST
    : `http://${HOST}:5000`;

export default { API_BASE_URL };
