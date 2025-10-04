import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  contentStyle?: any;
  scroll?: boolean;
};

export default function ResponsiveScreen({
  children,
  contentStyle,
  scroll = true,
}: Props) {
  const { width, height } = useWindowDimensions();
  const horizontalPadding = Math.min(Math.max(width * 0.05, 12), 28);
  const verticalPadding = Math.min(Math.max(height * 0.02, 8), 24);
  const paddingStyle = {
    paddingHorizontal: horizontalPadding,
    paddingVertical: verticalPadding,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 25 })}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, paddingStyle, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, paddingStyle, contentStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});
