// app/screens/MyserviceScreen.tsx
import BottomTab from "@/components/BottomTabs";
import ErrorBoundary from "@/components/ErrorBoundary";
import FloatingAddButton from "@/components/FloatingAddButton";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/AppNavigator";
import serviceProviders from "../services/serviceProviders";
import AddService from "./AddServiceScreen";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "MyServices">;

export default function MyserviceScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [jobList, setJobList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<any>(null);

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
      Alert.alert(t("confirmDelete"), t("areYouSureDeleteService"), [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => removeProviderService(serviceId),
        },
      ]);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setModalOpen(true);
  };

  useEffect(() => {
    fetchProviderPostedServices();
  }, []);

  const renderJob = ({ item }: { item: any }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={[styles.iconWrapper, { backgroundColor: "#e0e7ff" }]}>
          <Ionicons name="briefcase" size={24} color="#8b5cf6" />
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobServiceTypesIds}>
            {item.serviceTypes.map((st: any) => st.name).join(", ")}
          </Text>
          <View style={styles.jobDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color="#10b981" />
              <Text style={styles.jobAmount}>
                {`${item.amount} ${item.currency}/${item.rateType}`}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#64748b" />
              <Text style={styles.jobContactNumber}>{item.contactNumber}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.iconButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="pencil" size={20} color="#8b5cf6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
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
          <Text style={styles.headerTitle}>{t("myServices")}</Text>
          <View style={styles.headerIcon}>
            <Ionicons name="briefcase" size={24} color="#fff" />
          </View>
        </LinearGradient>

        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={styles.loadingText}>{t("loadingServices")}</Text>
            </View>
          ) : jobList.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.iconWrapper,
                  {
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#e0e7ff",
                  },
                ]}
              >
                <Ionicons name="briefcase-outline" size={40} color="#8b5cf6" />
              </View>
              <Text style={styles.emptyTitle}>{t("noServicesYet")}</Text>
              <Text style={styles.emptyText}>{t("tapToAddFirstService")}</Text>
            </View>
          ) : (
            <FlatList
              data={jobList}
              keyExtractor={(item) => item.id}
              renderItem={renderJob}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* ✅ Floating Add Button */}
        {/* Floating Add Button */}
        <FloatingAddButton
          onPress={() => {
            console.log("FAB pressed → opening native modal");
            setEditingService(null);
            setModalOpen(true);
          }}
        />

        {/* ✅ Native Add Service Modal (always visible on Android/iOS) */}
        <Modal
          visible={modalOpen}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setModalOpen(false)}
          statusBarTranslucent={false}
        >
          <SafeAreaView
            style={{ flex: 1, backgroundColor: "#fff" }}
            edges={["top", "bottom"]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setModalOpen(false)}
                style={styles.modalBackButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingService ? t("editService") : t("addService")}
              </Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView
              style={{ flex: 1, backgroundColor: "#f8fafc" }}
              contentContainerStyle={{ padding: 16 }}
            >
              <ErrorBoundary>
                <AddService
                  serviceData={editingService}
                  afterSubmit={() => {
                    setModalOpen(false);
                    setEditingService(null);
                    fetchProviderPostedServices();
                  }}
                />
              </ErrorBoundary>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* ✅ Web Delete Confirm Modal */}
        {Platform.OS === "web" && (
          <Modal
            visible={confirmVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.confirmBox}>
                <View
                  style={[
                    styles.iconWrapper,
                    {
                      backgroundColor: "#fee2e2",
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      marginBottom: 16,
                    },
                  ]}
                >
                  <Ionicons name="warning" size={32} color="#ef4444" />
                </View>
                <Text style={styles.confirmTitle}>{t("deleteService")}</Text>
                <Text style={styles.confirmText}>
                  {t("deleteServiceWarning")}
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmBtn, styles.confirmBtnCancel]}
                    onPress={() => setConfirmVisible(false)}
                  >
                    <Text style={styles.confirmBtnTextCancel}>
                      {t("cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, styles.confirmBtnDelete]}
                    onPress={() => {
                      if (selectedServiceId)
                        removeProviderService(selectedServiceId);
                      setConfirmVisible(false);
                    }}
                  >
                    <Text style={styles.confirmBtnText}>{t("delete")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ✅ Consistent bottom tab */}
        <BottomTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
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
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  jobInfo: { flex: 1 },
  jobServiceTypesIds: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  jobDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  jobAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  jobContactNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  editButton: {
    backgroundColor: "#f5f3ff",
    borderColor: "#e9d5ff",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    zIndex: 10000,
    elevation: 10,
  },
  modalBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  confirmBox: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnCancel: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  confirmBtnDelete: {
    backgroundColor: "#ef4444",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  confirmBtnTextCancel: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 15,
  },
});
