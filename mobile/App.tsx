// App.tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import { LanguageProvider } from "./app/contexts/LanguageContext";
import "./app/i18n/i18n.config";
import AppNavigator from "./app/navigation/AppNavigator";
import { ModalHostProvider } from "./components/ModalHost";

// UI Kitten / Eva
import * as eva from "@eva-design/eva";
import { ApplicationProvider, IconRegistry } from "@ui-kitten/components";
import { EvaIconsPack } from "@ui-kitten/eva-icons";

enableScreens();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={eva.light}>
        <LanguageProvider>
          <ModalHostProvider>
            <AppNavigator />
          </ModalHostProvider>
        </LanguageProvider>
      </ApplicationProvider>
    </GestureHandlerRootView>
  );
}
