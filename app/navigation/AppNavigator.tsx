import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";

import IndexScreen from "../(tabs)/index";
import AboutUsScreen from "../screens/AboutUsScreen";
import ChatBoxScreen from "../screens/ChatBoxScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MyServicesScreen from "../screens/MyServicesScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ReveiwFormScreen from "../screens/ReviewFormScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";

export type RootStackParamList = {
  Index: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  EditProfile: undefined;
  MyServices?: undefined;
  Subscription: undefined;
  ChatBox: { userId: string; name: string; profilePhoto?: string }; // ✅ Added profilePhoto
  Aboutus: undefined; // ✅ Added About Us
  PrivacyPolicy: undefined; // ✅ Added Privacy Policy
  ReveiwForm: undefined; // ✅ Added Privacy Policy
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole"); // e.g. "user" or "serviceProvider"
        setRole(storedRole);
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
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Index"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Index" component={IndexScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={ProfileEditScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Aboutus" component={AboutUsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="ReveiwForm" component={ReveiwFormScreen} />
        <Stack.Screen name="ChatBox" component={ChatBoxScreen} />

        {/* 👇 Only Service Providers can access MyServices */}
        {role === "serviceProvider" && (
          <Stack.Screen name="MyServices" component={MyServicesScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
