// app/screens/AddServiceScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import serviceprovidersApi from "../services/serviceProviders";
import serviceTypesApi from "../services/serviceTypes";

const { width } = Dimensions.get("window");

const RATE_OPTIONS = [
  { label: "Per Hour", value: "hourly" },
  { label: "Per Day", value: "daily" },
  { label: "Per Week", value: "weekly" },
  { label: "Per Month", value: "monthly" },
];

export default function AddServiceScreen({
  serviceData,
  afterSubmit,
}: {
  serviceData: any;
  afterSubmit: () => void;
}) {
  React.useEffect(() => {
    console.debug("AddServiceScreen: mounted");
    return () => {
      console.debug("AddServiceScreen: unmounted");
    };
  }, []);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [serviceItems, setServiceItems] = useState([] as any[]);
  const [rateItems, setRateItems] = useState(RATE_OPTIONS);

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [cost, setCost] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityItems] = useState([
    { label: "Morning (6am-10am)", value: "morning" },
    { label: "Afternoon (12pm-4pm)", value: "afternoon" },
    { label: "Evening (5pm-9pm)", value: "evening" },
    { label: "Night (9pm-12am)", value: "night" },
  ]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(
    []
  );

  const [errCost, setErrCost] = useState<string | null>(null);
  const [errContact, setErrContact] = useState<string | null>(null);

  // 🔹 Fetch service types once
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        setLoading(true);
        const response = await serviceTypesApi.getAll();
        const data = await response.data;
        setServiceItems(data.map((s: any) => ({ label: s.name, value: s.id })));
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceTypes();
  }, []);

  // 🔹 Populate / Reset form when serviceData changes
  useEffect(() => {
    if (serviceData) {
      setSelectedServices(
        serviceData.serviceTypes?.map((st: any) => st.id) || []
      );
      setSelectedRate(serviceData.rateType || null);
      setCost(serviceData.amount ? serviceData.amount.toString() : "");
      setContactNumber(serviceData.contactNumber || "");
    } else {
      setSelectedServices([]);
      setSelectedRate(null);
      setCost("");
      setContactNumber("");
    }
  }, [serviceData]);

  const onOpenServices = () => setRateOpen(false);
  const onOpenRate = () => setServicesOpen(false);

  const validateAndSubmit = async () => {
    Keyboard.dismiss();
    let valid = true;
    setErrCost(null);
    setErrContact(null);

    const costVal = parseFloat(cost);
    if (!cost || isNaN(costVal) || costVal <= 0) {
      setErrCost("Enter a valid cost (numeric, > 0).");
      valid = false;
    }

    const phoneOnly = contactNumber.replace(/\D/g, "");
    if (phoneOnly.length !== 10) {
      setErrContact("Enter a valid 10-digit phone number.");
      valid = false;
    }

    if (selectedServices.length === 0) {
      Alert.alert("Missing Info", "Please select at least one service.");
      valid = false;
    }

    if (!valid) return;

    try {
      setPosting(true);
      const storedId = await AsyncStorage.getItem("userId");
      const providerIdNum = storedId ? parseInt(storedId, 10) : undefined;

      if (!providerIdNum) {
        Alert.alert(
          "Error",
          "Unable to determine provider id. Please login again."
        );
        setPosting(false);
        return;
      }

      const payload = {
        providerId: providerIdNum,
        serviceTypeIds: selectedServices,
        rateType: selectedRate || "",
        amount: costVal,
        contactNumber: phoneOnly,
        currency: "INR",
        availabilitySlots: selectedAvailability,
      };

      if (serviceData) {
        await serviceprovidersApi.editService(serviceData.id, payload);
      } else {
        await serviceprovidersApi.createService(payload);
      }

      Alert.alert("Success", "Your service has been posted!");
      afterSubmit();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to post service. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={["#6366f1", "#8b5cf6", "#a855f7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Ionicons name="briefcase" size={44} color="#ffffff" />
            <Text style={styles.heading}>
              {serviceData ? "Update Service" : "Post New Service"}
            </Text>
            <Text style={styles.subheading}>
              {serviceData
                ? "Edit your service details"
                : "Share your expertise with clients"}
            </Text>
          </LinearGradient>

          {/* Service Type Card */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Ionicons name="list" size={18} color="#6366f1" />
              <Text style={styles.sectionLabel}>Service Type</Text>
            </View>
            <View
              style={[
                styles.dropdownWrapper,
                { zIndex: servicesOpen ? 5000 : 3000 },
              ]}
            >
              <DropDownPicker
                open={servicesOpen}
                setOpen={setServicesOpen}
                onOpen={onOpenServices}
                mode="BADGE"
                multiple={true}
                min={1}
                max={serviceItems.length}
                value={selectedServices}
                setValue={setSelectedServices}
                items={serviceItems}
                setItems={setServiceItems}
                placeholder="Select Services"
                listMode={Platform.OS === "web" ? "SCROLLVIEW" : "MODAL"}
                dropDownDirection="AUTO"
                dropDownContainerStyle={styles.dropDownContainer}
                style={styles.dropdown}
                textStyle={styles.dropdownText}
                scrollViewProps={{ nestedScrollEnabled: true }}
              />
            </View>
          </View>

          {/* Rate Type Card */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Ionicons name="time" size={18} color="#6366f1" />
              <Text style={styles.sectionLabel}>Rate Type</Text>
            </View>
            <View
              style={[
                styles.dropdownWrapper,
                { zIndex: rateOpen ? 4000 : 2000 },
              ]}
            >
              <DropDownPicker
                open={rateOpen}
                setOpen={setRateOpen}
                onOpen={onOpenRate}
                multiple={false}
                value={selectedRate}
                setValue={setSelectedRate}
                items={rateItems}
                setItems={setRateItems}
                placeholder="Select Rate Type"
                listMode={Platform.OS === "web" ? "SCROLLVIEW" : "MODAL"}
                dropDownDirection="AUTO"
                dropDownContainerStyle={styles.dropDownContainer}
                style={styles.dropdown}
                textStyle={styles.dropdownText}
              />
            </View>
          </View>

          {/* Cost Card */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Ionicons name="cash" size={18} color="#6366f1" />
              <Text style={styles.sectionLabel}>Cost (INR)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your rate"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={cost}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, "");
                setCost(numericText);
              }}
            />
            {errCost && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errText}>{errCost}</Text>
              </View>
            )}
          </View>

          {/* Contact Card */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Ionicons name="call" size={18} color="#6366f1" />
              <Text style={styles.sectionLabel}>Contact Number</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit phone number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={contactNumber}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, "").slice(0, 10);
                setContactNumber(numericText);
              }}
              maxLength={15}
            />
            {errContact && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errText}>{errContact}</Text>
              </View>
            )}
          </View>

          {/* Availability Card */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Ionicons name="calendar" size={18} color="#6366f1" />
              <Text style={styles.sectionLabel}>Availability Slots</Text>
            </View>
            <View
              style={[
                styles.dropdownWrapper,
                { zIndex: availabilityOpen ? 6000 : 1000 },
              ]}
            >
              <DropDownPicker
                open={availabilityOpen}
                setOpen={setAvailabilityOpen}
                multiple={true}
                min={0}
                max={4}
                value={selectedAvailability}
                setValue={setSelectedAvailability}
                items={availabilityItems}
                listMode={Platform.OS === "web" ? "SCROLLVIEW" : "MODAL"}
                placeholder="Select availability slots"
                dropDownContainerStyle={styles.dropDownContainer}
                style={styles.dropdown}
                textStyle={styles.dropdownText}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={validateAndSubmit}
            disabled={posting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                posting
                  ? ["#cbd5e1", "#94a3b8"]
                  : ["#10b981", "#059669", "#047857"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButton}
            >
              {posting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons
                    name={serviceData ? "checkmark-circle" : "rocket"}
                    size={20}
                    color="#ffffff"
                  />
                  <Text style={styles.buttonText}>
                    {serviceData ? "Update Service" : "Post Service"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 12,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: "#e0e7ff",
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  dropdownWrapper: {
    position: "relative",
  },
  dropdown: {
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 14,
    color: "#1e293b",
  },
  dropDownContainer: {
    borderColor: "#e2e8f0",
    borderRadius: 12,
    maxHeight: 220,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  errText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
