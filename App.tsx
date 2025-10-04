// App.tsx
import React from "react";
import AppNavigator from "./app/navigation/AppNavigator";
import { ModalHostProvider } from "./components/ModalHost";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";

enableScreens();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ModalHostProvider>
        <AppNavigator />
      </ModalHostProvider>
    </GestureHandlerRootView>
  );
}
