import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../utills/config";

// Axios instance for the app. We add debug logging to help surface network
// configuration issues (e.g. wrong LAN IP / ngrok not set) which commonly
// cause `AxiosError: Network Error` on device builds.
const api = axios.create({ baseURL: API_BASE_URL, timeout: 200000 });

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) (config.headers as any).Authorization = `Bearer ${token}`;

      // If the request body is a FormData (file upload), ensure headers are OK.
      // In React Native it's usually best to let axios set the multipart boundary.
      if (
        config.data &&
        typeof config.data === "object" &&
        config.data._parts
      ) {
        // do not set Content-Type explicitly here to allow boundary to be added
      }

      // Debug: log outgoing request (method + full url) to Metro so it's easy
      // to confirm which host the app is trying to contact.
      // Example log: "API -> PUT http://192.168.x.x:5000/api/profile/update"
      const fullUrl = `${API_BASE_URL.replace(/\/$/, "")}${
        config.url?.startsWith("/") ? config.url : `/${config.url}`
      }`;
      console.debug("API ->", (config.method || "GET").toUpperCase(), fullUrl);
    } catch (err) {
      // swallow logging errors to avoid breaking requests
      console.warn("api.request.interceptor error:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response logger — helps show status and small response snapshots in Metro.
api.interceptors.response.use(
  (res) => {
    // keep logs small
    console.debug(
      "API <-",
      res.config?.method?.toUpperCase(),
      res.config?.url,
      "status:",
      res.status
    );
    return res;
  },
  async (error) => {
    // Handle 401 Unauthorized - token expired or invalid (suppress detailed error logging)
    if (error?.response?.status === 401) {
      console.log("⚠️ Session expired. Redirecting to login...");

      // Clear all auth data
      try {
        await AsyncStorage.multiRemove([
          "token",
          "userId",
          "userRole",
          "userData",
          "profilePhoto",
        ]);

        // Import navigation dynamically to avoid circular dependencies
        const { CommonActions } = await import("@react-navigation/native");
        const navigationRef = (await import("../navigation/navigationRef"))
          .navigationRef;

        // Navigate to Login and reset navigation stack
        if (navigationRef.isReady()) {
          navigationRef.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        }
      } catch (logoutError) {
        console.error("Error during auto-logout:", logoutError);
      }
    } else {
      // Log other API errors (non-401) with full details
      console.error("API error ->", error?.message || error);
      if (error?.config) {
        console.error("API error config ->", {
          method: error.config.method,
          url: `${API_BASE_URL.replace(/\/$/, "")}${
            error.config.url?.startsWith("/")
              ? error.config.url
              : `/${error.config.url}`
          }`,
          timeout: error.config.timeout,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
