import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
type Props = NativeStackScreenProps<RootStackParamList, "Index">;

export default function IndexScreen({ navigation }: Props) {
  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!mounted) return;
        if (token) navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        else navigation.replace("Login");
      } catch (err) {
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
});
