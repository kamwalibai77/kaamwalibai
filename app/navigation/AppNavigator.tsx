import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";

import IndexScreen from "../(tabs)/index";
import AboutUsScreen from "../screens/AboutUsScreen";
import ChatBoxScreen from "../screens/ChatBoxScreen";
import ChatScreen from "../screens/ChatScreen";
import HomeScreen from "../screens/HomeScreen";
import Breadcrumbs from "../../components/Breadcrumbs";
import LoginScreen from "../screens/LoginScreen";
import MyServicesScreen from "../screens/MyServicesScreen";
import KYCScreen from "../screens/KYCScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ReveiwFormScreen from "../screens/ReviewFormScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";

export type RootStackParamList = {
  Index: undefined;
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  EditProfile: undefined;
  MyServices?: undefined;
  Chat: undefined;
  Subscription: undefined;
  KYC: undefined;
  Settings: undefined;
  ChatBox: { userId: string; name: string; profilePhoto?: string }; // ✅ Added profilePhoto
  Aboutus: undefined; // ✅ Added About Us
  PrivacyPolicy: undefined; // ✅ Added Privacy Policy
  ReveiwForm: undefined; // ✅ Added Privacy Policy
  FAQ: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigationState, setNavigationState] = useState<any | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole"); // e.g. "user" or "serviceProvider"
        // Normalize common variants so the navigator and UI use the same canonical value
        let normalized: string | null = storedRole;
        if (storedRole) {
          const compact = storedRole.replace(/[^a-zA-Z]/g, "").toLowerCase();
          if (compact === "ServiceProvider") {
            normalized = "ServiceProvider"; // canonical form used across the app
          }
        }
        setRole(normalized);
      } catch (err) {
        console.log("Error fetching role:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  if (loading) return null; // optional: show loader/spinner here

  return (
    <NavigationContainer onStateChange={(s) => setNavigationState(s)}>
      <Breadcrumbs state={navigationState} />
      <Stack.Navigator
        initialRouteName="Index"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Index" component={IndexScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={ProfileEditScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="KYC" component={KYCScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Aboutus" component={AboutUsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="ReveiwForm" component={ReveiwFormScreen} />
        <Stack.Screen
          name="FAQ"
          component={require("../screens/FAQScreen").default}
        />
        <Stack.Screen name="ChatBox" component={ChatBoxScreen} />
        {/* 👇 Only Service Providers can access MyServices */}
        {role === "serviceProvider" && (
          <Stack.Screen name="MyServices" component={MyServicesScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
