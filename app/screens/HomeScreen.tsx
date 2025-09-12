// app/screens/HomeScreen.tsx
import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const router = useRouter();
  const handleLogout = async () => {
    await AsyncStorage.setItem("token", "");
    await AsyncStorage.setItem("userRole", "");
    await AsyncStorage.setItem("userId", "");

    // ✅ Redirect to ProfileScreen
    router.navigate("/screens/LoginScreen");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Maid Service App 👋</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
});
