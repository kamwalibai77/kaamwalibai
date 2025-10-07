import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";
import api from "../services/api";

type Faq = { id: number; question: string; answer: string };

export default function FAQScreen({ navigation }: any) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchFaqs = async () => {
      try {
        const res = await api.get("/faqs");
        if (!mounted) return;
        if (res?.data?.success) setFaqs(res.data.data || []);
      } catch (err) {
        console.error("FAQ fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchFaqs();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Ionicons
            name="help-circle-outline"
            size={28}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
          <Text style={styles.headerText}>FAQ</Text>
        </View>
        <View style={[styles.section, { alignItems: "center" }]}>
          <ActivityIndicator />
        </View>
        <BottomTab />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Ionicons
          name="help-circle-outline"
          size={28}
          color="#fff"
          style={{ marginLeft: 8 }}
        />
        <Text style={styles.headerText}>FAQ</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {faqs.length === 0 ? (
          <View style={styles.section}>
            <Text style={styles.title}>No FAQs available</Text>
            <Text style={styles.text}>
              We don't have any frequently asked questions at the moment.
            </Text>
          </View>
        ) : (
          faqs.map((f) => (
            <View style={styles.section} key={f.id}>
              <Ionicons name="help-circle-outline" size={22} color="#075e54" />
              <Text style={styles.title}>{f.question}</Text>
              <Text style={styles.text}>{f.answer}</Text>
            </View>
          ))
        )}
      </ScrollView>

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
    paddingBottom: 100,
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
  section: {
    backgroundColor: "white",
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#075e54",
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
    lineHeight: 22,
  },
});
