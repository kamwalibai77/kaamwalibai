// app/layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> {/* Splash Screen */}
      <Stack.Screen name="RegisterScreen" /> {/* Register Screen */}
    </Stack>
  );
}
