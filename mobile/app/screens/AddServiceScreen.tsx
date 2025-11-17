// app/screens/AddServiceScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import serviceprovidersApi from "../services/serviceProviders";
import serviceTypesApi from "../services/serviceTypes";

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Service Type</Text>
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

          <Text style={styles.sectionLabel}>Rate Type</Text>
          <View
            style={[styles.dropdownWrapper, { zIndex: rateOpen ? 4000 : 2000 }]}
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

          <Text style={styles.sectionLabel}>Cost</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Cost"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={cost}
            onChangeText={(text) => {
              const numericText = text.replace(/[^0-9]/g, "");
              setCost(numericText);
            }}
          />
          {errCost && <Text style={styles.errText}>{errCost}</Text>}

          <Text style={styles.sectionLabel}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Active Contact Number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={(text) => {
              const numericText = text.replace(/[^0-9]/g, "").slice(0, 10);
              setContactNumber(numericText);
            }}
            maxLength={15}
          />
          {errContact && <Text style={styles.errText}>{errContact}</Text>}

          <Text style={styles.sectionLabel}>Availability</Text>
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

        <TouchableOpacity
          style={[styles.button, posting && { opacity: 0.7 }]}
          onPress={validateAndSubmit}
          disabled={posting}
        >
          {posting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              🚀 {serviceData ? "Update" : "Post"} Service
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  dropdownWrapper: {
    marginBottom: 14,
    position: "relative",
  },
  dropdown: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
  },
  dropdownText: {
    fontSize: 14,
    color: "#111827",
  },
  dropDownContainer: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    maxHeight: 200,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#f9fafb",
    marginBottom: 6,
  },
  errText: {
    color: "#dc2626",
    marginBottom: 6,
    fontSize: 13,
  },
  button: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
