import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";
import api from "../services/api";

export default function ReviewFormScreen({ navigation, route }: any) {
  const providerId = route?.params?.providerId;
  const providerName = route?.params?.providerName;
  const isAppReview = route?.params?.isAppReview;
  const providerPhoto = route?.params?.providerPhoto;
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating.");
      return;
    }

    // Resolve provider id from route params or fallback storage
    let resolvedProviderId: any = providerId;
    if (!resolvedProviderId) {
      resolvedProviderId =
        route?.params?.providerId ||
        route?.params?.userId ||
        route?.params?.ratedId ||
        route?.params?.rated_id;
    }
    if (!resolvedProviderId) {
      const stored = await AsyncStorage.getItem("selectedProviderId");
      if (stored) resolvedProviderId = parseInt(stored, 10);
    }
    // If this is an application-level review, we don't need a provider id.
    if (!resolvedProviderId && !isAppReview) {
      Alert.alert("Error", "No provider selected to rate.");
      console.warn(
        "ReviewForm: missing providerId — route.params:",
        route?.params
      );
      return;
    }

    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert(
        "Authentication required",
        "Please login to submit a rating.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ]
      );
      return;
    }

    const parsedProviderId = resolvedProviderId
      ? parseInt(String(resolvedProviderId), 10)
      : null;

    const payload: any = {
      score: rating,
      comment,
      // For app reviews, send a special ratedId of 0 and flag isAppReview
      ratedId: isAppReview ? 0 : parsedProviderId,
      rated_id: isAppReview ? 0 : parsedProviderId,
      providerId: isAppReview ? null : parsedProviderId,
      provider_id: isAppReview ? null : parsedProviderId,
      isAppReview: !!isAppReview,
    };

    try {
      console.debug("Submitting rating payload:", payload);
      setSubmitting(true);
      const res = await api.post("/rating/rate", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Success", "Your review has been submitted!");
      setName("");
      setRating(0);
      setComment("");
      navigation.goBack();
    } catch (err: any) {
      console.error("Error submitting rating", err?.response || err);
      const message = err?.response?.data?.error || "Unable to submit review";
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* Gradient Header */}
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#c084fc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        {/* 🧾 Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Provider Card */}
          <View style={styles.providerCard}>
            <Image
              source={{
                uri:
                  providerPhoto ||
                  "https://randomuser.me/api/portraits/lego/1.jpg",
              }}
              style={styles.providerAvatar}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerLabel}>Reviewing</Text>
              <Text style={styles.providerName}>
                {providerName ? providerName : "Provider"}
              </Text>
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Rating:</Text>
          <View style={styles.starsCard}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={rating >= star ? "star" : "star-outline"}
                    size={44}
                    color={rating >= star ? "#fbbf24" : "#cbd5e1"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating} {rating === 1 ? "Star" : "Stars"}
              </Text>
            )}
          </View>

          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Write your review..."
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <TouchableOpacity
            style={[styles.button, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {submitting ? (
                <Text style={styles.buttonText}>Submitting...</Text>
              ) : (
                <>
                  <Text style={styles.buttonText}>Submit Review</Text>
                  <Ionicons name="send" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* 🔻 Bottom Tab */}
        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 20,
    backgroundColor: "#f8fafc",
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#8b5cf6",
  },
  providerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  providerLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  starsCard: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  starButton: {
    padding: 8,
    borderRadius: 8,
  },
  ratingText: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "700",
    color: "#8b5cf6",
  },
  button: {
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
