// app/screens/ReviewFormScreen.tsx
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Feedback() {
  const [name, setName] = useState(""); // optional: user name
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !comment.trim() || rating === 0) {
      Alert.alert("Error", "Please fill all fields and select a rating.");
      return;
    }

    // 🔥 Here you can call your API to submit review
    console.log("Review submitted:", { name, rating, comment });

    Alert.alert("Success", "Your review has been submitted!");
    setName("");
    setRating(0);
    setComment("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Submit a Review</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f0f0" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, marginVertical: 10 },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  starsContainer: { flexDirection: "row", marginBottom: 15 },
  star: { fontSize: 30, marginRight: 5 },
  filledStar: { color: "#ffd700" },
  emptyStar: { color: "#ccc" },
  button: {
    backgroundColor: "#128c7e",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
