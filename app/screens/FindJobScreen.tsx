// app/screens/FindJobScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import BottomTab from "@/components/BottomTabs";
import FloatingAddButton from "@/components/FloatingAddButton";
import AddService from "./AddServiceScreen";

const { width } = Dimensions.get("window");

// Sample jobs data
const jobs = [
  {
    id: "1",
    title: "House Cleaning Needed",
    service: "Cleaning",
    salary: "₹500/day",
    location: "Andheri, Mumbai",
  },
  {
    id: "2",
    title: "Baby Care Required",
    service: "Babysitting",
    salary: "₹800/day",
    location: "Powai, Mumbai",
  },
  {
    id: "3",
    title: "Gardening Service",
    service: "Gardening",
    salary: "₹600/day",
    location: "Bandra, Mumbai",
  },
  {
    id: "4",
    title: "Cook Needed",
    service: "Cooking",
    salary: "₹700/day",
    location: "Malad, Mumbai",
  },
];

export default function FindJobScreen() {
  const router = useRouter();
  const [jobList, setJobList] = useState(jobs);
  const [open, setOpen] = useState(false);

  const renderJob = ({ item }: { item: (typeof jobs)[0] }) => (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={styles.jobCard}>
      <View style={styles.jobInfo}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobService}>{item.service}</Text>
        <Text style={styles.jobSalary}>{item.salary}</Text>
        <Text style={styles.jobLocation}>
          <Ionicons name="location-outline" size={14} color="#64748b" />{" "}
          {item.location}
        </Text>
      </View>
      <TouchableOpacity style={styles.applyButton}>
        <LinearGradient
          colors={["#6366f1", "#4f46e5"]}
          style={styles.applyGradient}
        >
          <Text style={styles.applyText}>Apply</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Find Jobs Nearby</Text>
        <FlatList
          data={jobList}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
        <FloatingAddButton onPress={() => setOpen(true)} />
        {/* ✅ Popup Modal */}
        <Modal visible={open} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}></Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <Ionicons name="close" size={24} color="#1e293b" />
                </TouchableOpacity>
              </View>

              {/* PostServicePage inside modal */}
              <AddService />
            </View>
          </View>
        </Modal>
      </View>
      {/* Bottom Tabs (same as before) */}
      <BottomTab />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: 15,
    marginBottom: 15,
  },
  jobCard: {
    width: width - 30,
    borderRadius: 20,
    marginBottom: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 5,
    elevation: 3,
  },
  jobInfo: {
    flex: 1,
    paddingRight: 10,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  jobService: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 4,
  },
  jobSalary: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10b981",
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 12,
    color: "#64748b",
  },
  applyButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  applyGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
});
