import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{
            uri:
              providerPhoto || "https://randomuser.me/api/portraits/lego/1.jpg",
          }}
          style={styles.headerAvatar}
        />
        <Text style={[styles.headerText, { marginLeft: 8 }]}>
          Review {providerName ? providerName : "Provider"}
        </Text>
      </View>

      {/* 🧾 Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Rating:</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text
                style={[
                  styles.star,
                  rating >= star ? styles.filledStar : styles.emptyStar,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
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
          <Text style={styles.buttonText}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 🔻 Bottom Tab */}
      <BottomTab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#075e54",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 5,
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  star: {
    fontSize: 34,
    marginRight: 8,
  },
  filledStar: {
    color: "#ffd700",
  },
  emptyStar: {
    color: "#ccc",
  },
  button: {
    backgroundColor: "#128c7e",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
