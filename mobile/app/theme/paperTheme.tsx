import { Platform } from "react-native";
import { MD3LightTheme as DefaultTheme } from "react-native-paper";

const fontConfig = {
  default: {
    regular: {
      fontFamily: Platform.OS === "android" ? "sans-serif" : "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: Platform.OS === "android" ? "sans-serif-medium" : "System",
      fontWeight: "500",
    },
    light: {
      fontFamily: Platform.OS === "android" ? "sans-serif-light" : "System",
      fontWeight: "300",
    },
    thin: {
      fontFamily: Platform.OS === "android" ? "sans-serif-thin" : "System",
      fontWeight: "100",
    },
  },
};

export const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6366f1",
    secondary: "#10b981",
    background: "#f9fafb",
    surface: "#ffffff",
    error: "#ef4444",
  },
};

export default paperTheme;
