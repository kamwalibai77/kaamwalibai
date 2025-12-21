// Navigation reference to allow navigation from outside React components
// This is useful for API interceptors and other utilities
import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "./AppNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
  }
}
