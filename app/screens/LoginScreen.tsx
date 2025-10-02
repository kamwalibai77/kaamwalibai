import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import api from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!mounted) return;
        if (token) navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } catch (e) {
        // ignore and allow login
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigation]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (phoneNumber && password) {
      try {
        const response = await api.post("/auth/login", {
          phoneNumber,
          password,
        });
        const data = await response.data;
        console.log("✅ Registration successful:", data);
        await AsyncStorage.setItem("token", String(data.token));
        await AsyncStorage.setItem("userRole", String(data.role));
        await AsyncStorage.setItem("userId", String(data.id));

        // ✅ Reset the navigation state and set Home as the only route so
        // the back button cannot return to the auth screens.
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } catch (err) {
        const msg =
          (err as any)?.response?.data?.error ??
          (err as any)?.message ??
          "Login failed";
        Alert.alert("Error", String(msg));
      }
    } else {
      Alert.alert("Please enter phoneNumber and password");
    }
  };

  return (
    <LinearGradient colors={["#f8fafc", "#e0e7ff"]} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Login to your account</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#6366f1"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9+]/g, "").slice(0, 13);
                setPhoneNumber(numericText);
              }}
              autoCapitalize="none"
              keyboardType="phone-pad"
              placeholderTextColor="#a5b4fc"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#6366f1"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#a5b4fc"
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <LinearGradient
              colors={["#6366f1", "#818cf8"]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerText}>
              Don&apos;t have an account?{" "}
              <Text style={{ color: "#6366f1", fontWeight: "bold" }}>
                Register
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    width: "100%",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#334155",
  },
  button: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  registerText: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
});
