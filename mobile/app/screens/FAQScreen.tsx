import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTab from "../../components/BottomTabs";
import api from "../services/api";

type Faq = { id: number; question: string; answer: string };

export default function FAQScreen({ navigation }: any) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
        <View style={{ flex: 1 }}>
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
            <Text style={styles.headerTitle}>FAQ</Text>
            <View style={styles.headerIcon}>
              <Ionicons name="help-circle" size={24} color="#fff" />
            </View>
          </LinearGradient>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Loading FAQs...</Text>
          </View>
          <BottomTab />
        </View>
      </SafeAreaView>
    );

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
          <Text style={styles.headerTitle}>FAQ</Text>
          <View style={styles.headerIcon}>
            <Ionicons name="help-circle" size={24} color="#fff" />
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {faqs.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: "#e0e7ff",
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                  },
                ]}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={40}
                  color="#8b5cf6"
                />
              </View>
              <Text style={styles.emptyTitle}>No FAQs Available</Text>
              <Text style={styles.emptyText}>
                We don't have any frequently asked questions at the moment.
              </Text>
            </View>
          ) : (
            faqs.map((f) => (
              <TouchableOpacity
                style={styles.faqCard}
                key={f.id}
                onPress={() => setExpandedId(expandedId === f.id ? null : f.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <View
                    style={[styles.iconWrapper, { backgroundColor: "#e0e7ff" }]}
                  >
                    <Ionicons name="help-circle" size={24} color="#8b5cf6" />
                  </View>
                  <Text style={styles.faqQuestion}>{f.question}</Text>
                  <Ionicons
                    name={expandedId === f.id ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#8b5cf6"
                  />
                </View>
                {expandedId === f.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.answerText}>{f.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    paddingBottom: 120,
    paddingTop: 8,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
  faqCard: {
    backgroundColor: "#fff",
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    paddingLeft: 72,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  answerText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
  },
});
