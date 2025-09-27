// app/layout.tsx
import React from "react";

// Neutralized layout to avoid expo-router building its own navigation stack
// The app now uses React Navigation (AppNavigator) as the single router.
export default function RootLayout() {
  return null;
}
