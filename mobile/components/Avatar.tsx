import { useState } from "react";
import { Image, ImageStyle, StyleProp, StyleSheet, View } from "react-native";

type Props = {
  uri?: string | null;
  size?: number;
  showUnreadDot?: boolean;
  style?: StyleProp<ImageStyle>;
};

export default function Avatar({
  uri,
  size = 55,
  showUnreadDot = false,
  style,
}: Props) {
  const [error, setError] = useState(false);

  // placeholder image in the project
  const placeholder = require("../assets/images/default.png");

  // Only use URI if it's valid (starts with http/https)
  const isValidUri =
    uri && (uri.startsWith("http://") || uri.startsWith("https://"));
  const source = !isValidUri || error ? placeholder : ({ uri } as any);

  return (
    <View
      style={[
        styles.wrapper,
        { width: size + 7, height: size + 7, borderRadius: (size + 7) / 2 },
      ]}
    >
      <Image
        source={source}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        onError={() => setError(true)}
        resizeMode="cover"
      />
      {showUnreadDot && <View style={styles.unreadDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef2f7",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  unreadDot: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#25d366",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
