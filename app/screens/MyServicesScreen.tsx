// app/screens/FindJobScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import BottomTab from "@/components/BottomTabs";
import FloatingAddButton from "@/components/FloatingAddButton";
import AddService from "./AddServiceScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import serviceProviders from "../services/serviceProviders";

const { width } = Dimensions.get("window");

export default function MyserviceScreen() {
  const router = useRouter();
  const [jobList, setJobList] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProviderPostedServices = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const response = await serviceProviders.getAllProviderPostedServices(
        userId
      );
      const data = await response.data;
      setJobList(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderPostedServices();
  }, []);

  const renderJob = ({ item }: { item: any }) => (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={styles.jobCard}>
      {/* Left side info */}
      <View style={styles.jobInfo}>
        <Text style={styles.jobServiceTypesIds}>
          {item.serviceTypeIds.join(", ")}
        </Text>
        <Text
          style={styles.jobAmount}
        >{`${item.amount} ${item.currency}/${item.rateType}`}</Text>
        <Text style={styles.jobContactNumber}>{item.contactNumber}</Text>
      </View>

      {/* Right side action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="pencil" size={22} color="#4f46e5" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { marginLeft: 12 }]}>
          <Ionicons name="trash" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>My Services</Text>
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
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}></Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <Ionicons name="close" size={24} color="#1e293b" />
                </TouchableOpacity>
              </View>
              <AddService
                afterSubmit={() => {
                  setOpen(false);
                  fetchProviderPostedServices();
                }}
              />
            </View>
          </View>
        </Modal>
      </View>
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
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  jobInfo: {
    flex: 1,
    paddingRight: 10,
  },
  jobServiceTypesIds: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 4,
  },
  jobAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10b981",
    marginBottom: 4,
  },
  jobContactNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {},
});
