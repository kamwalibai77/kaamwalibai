// app/screens/FindJobScreen.tsx
import React, { useState, useEffect } from "react";
import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import BottomTab from "@/components/BottomTabs";
import FloatingAddButton from "@/components/FloatingAddButton";
import AddService from "./AddServiceScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import AsyncStorage from "@react-native-async-storage/async-storage";
import serviceProviders from "../services/serviceProviders";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "MyServices">;

export default function MyserviceScreen({ navigation }: Props) {
  // Toggle this to true to render a simple placeholder instead of AddService
  // Useful when debugging whether AddService itself is failing to mount.
  const TEST_RENDER = false;
  // Small inner component to log when modal content actually renders/mounts
  const ModalInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
      console.log("MyServicesScreen: ModalInner mounted");
      return () => console.log("MyServicesScreen: ModalInner unmounted");
    }, []);
    return <>{children}</>;
  };
  const [jobList, setJobList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<any>(null);
  // We'll use the imperative openModal/closeModal API exported by ModalHost
  // (this avoids calling hooks conditionally and avoids invalid hook call errors)
  // ...existing code...

  // Web-only confirmation modal
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

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

  const removeProviderService = async (serviceId: string) => {
    try {
      await serviceProviders.removeProviderService(serviceId);
      fetchProviderPostedServices();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (serviceId: string) => {
    if (Platform.OS === "web") {
      setSelectedServiceId(serviceId);
      setConfirmVisible(true);
    } else {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this service?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => removeProviderService(serviceId),
          },
        ]
      );
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setModalOpen(true);
  };

  useEffect(() => {
    fetchProviderPostedServices();
  }, []);

  // Debug modal open state changes (helps on-device)
  useEffect(() => {
    console.log("MyServicesScreen: modalOpen =>", modalOpen);
  }, [modalOpen]);

  const renderJob = ({ item }: { item: any }) => (
    <LinearGradient colors={["#eef2ff", "#e0e7ff"]} style={styles.jobCard}>
      <View style={styles.jobInfo}>
        <Text style={styles.jobServiceTypesIds}>
          {item.serviceTypes.map((st: any) => st.name).join(", ")}
        </Text>
        <Text
          style={styles.jobAmount}
        >{`${item.amount} ${item.currency}/${item.rateType}`}</Text>
        <Text style={styles.jobContactNumber}>{item.contactNumber}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="pencil" size={22} color="#4f46e5" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { marginLeft: 12 }]}
          onPress={() => handleDelete(item.id)}
        >
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
        <FloatingAddButton
          onPress={() => {
            console.log(
              "MyServicesScreen: FloatingAddButton onPress - opening modal via ModalHost"
            );
            try {
              const { openModal, closeModal } = require("@/components/ModalHost");
              openModal(
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {editingService ? "Edit Service" : "Add Service"}
                    </Text>
                    <TouchableOpacity onPress={() => closeModal()}>
                      <Ionicons name="close" size={24} color="#1e293b" />
                    </TouchableOpacity>
                  </View>
                  <ErrorBoundary>
                    <AddService
                      serviceData={editingService}
                      afterSubmit={() => {
                        closeModal();
                        setEditingService(null);
                        fetchProviderPostedServices();
                      }}
                    />
                  </ErrorBoundary>
                </View>
              );
            } catch (e) {
              console.warn("ModalHost open failed, falling back to inline modal:", e);
              setModalOpen(true);
            }
          }}
        />

        {/* ✅ Web-only Delete Confirmation Modal */}
        {Platform.OS === "web" && (
          <Modal
            visible={confirmVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>
                  Are you sure you want to delete this service?
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: "#ef4444" }]}
                    onPress={() => {
                      if (selectedServiceId)
                        removeProviderService(selectedServiceId);
                      setConfirmVisible(false);
                    }}
                  >
                    <Text style={styles.confirmBtnText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: "#6b7280" }]}
                    onPress={() => setConfirmVisible(false)}
                  >
                    <Text style={styles.confirmBtnText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
      <BottomTab />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingTop: 10 },
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
  jobInfo: { flex: 1, paddingRight: 10 },
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
  jobContactNumber: { fontSize: 14, fontWeight: "500", color: "#374151" },
  actionButtons: { flexDirection: "row", alignItems: "center" },
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
    marginHorizontal: 20,
    marginTop: 60,
    padding: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  confirmBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmBtn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
