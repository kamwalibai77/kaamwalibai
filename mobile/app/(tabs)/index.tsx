import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Index">;

export default function IndexScreen({ navigation }: Props) {
  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!mounted) return;

        if (token) {
          // Validate token by making a quick API call
          try {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            // Try to fetch user profile or verify token
            const response = await api.get("/profile");
            if (response.data && mounted) {
              // Token is valid, proceed to home
              navigation.reset({ index: 0, routes: [{ name: "Home" }] });
              return;
            }
          } catch (err) {
            // Token is invalid, clear storage
            console.log("Token validation failed, clearing storage");
            await AsyncStorage.multiRemove([
              "token",
              "userId",
              "userRole",
              "phoneNumber",
            ]);
          }
        }

        // No token or invalid token, go to login
        if (mounted) navigation.replace("Login");
      } catch (err) {
        console.error("Bootstrap error:", err);
        if (mounted) navigation.replace("Login");
      }
    };
    const timer = setTimeout(bootstrap, 700);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 200,
    height: 200,
  },
  loader: {
    marginTop: 20,
  },
});
