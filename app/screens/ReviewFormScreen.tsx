import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BottomTab from "../../components/BottomTabs";

export default function ReviewFormScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !comment.trim() || rating === 0) {
      Alert.alert("Error", "Please fill all fields and select a rating.");
      return;
    }

    console.log("Review submitted:", { name, rating, comment });
    Alert.alert("Success", "Your review has been submitted!");
    setName("");
    setRating(0);
    setComment("");
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
        <Ionicons
          name="star-outline"
          size={26}
          color="#fff"
          style={{ marginLeft: 8 }}
        />
        <Text style={styles.headerText}>Submit a Review</Text>
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

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Review</Text>
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
