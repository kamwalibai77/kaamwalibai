import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  message?: string | null;
  duration?: number; // ms
  onDismiss?: () => void;
};

export default function Snackbar({
  message,
  duration = 3000,
  onDismiss,
}: Props) {
  const [visible, setVisible] = useState(!!message);
  const translateY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (message) {
      setVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
      const t = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: 60,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
          onDismiss && onDismiss();
        });
      }, duration);
      return () => clearTimeout(t);
    }
    return;
  }, [message]);

  if (!visible || !message) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.inner}>
        <Text style={styles.text}>{message}</Text>
        <TouchableOpacity
          onPress={() => {
            Animated.timing(translateY, {
              toValue: 60,
              duration: 160,
              useNativeDriver: true,
            }).start(() => {
              setVisible(false);
              onDismiss && onDismiss();
            });
          }}
        >
          <Text style={styles.close}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 18,
    zIndex: 2000,
    alignItems: "center",
  },
  inner: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 200,
  },
  text: { color: "#fff", marginRight: 12 },
  close: { color: "#93c5fd", fontWeight: "600" },
});
