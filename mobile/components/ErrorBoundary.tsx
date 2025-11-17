import React from "react";
import { View, Text, StyleSheet } from "react-native";

type State = { hasError: boolean; error?: Error | null };

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Component failed to render</Text>
          <Text style={styles.message}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children as any;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    marginHorizontal: 12,
  },
  title: { fontWeight: "700", color: "#7f1d1d", marginBottom: 6 },
  message: { color: "#7f1d1d" },
});
