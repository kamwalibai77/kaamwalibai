import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import serviceTypesApi from "../services/serviceTypes";
import serviceprovidersApi from "../services/serviceProviders";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RATE_OPTIONS = [
  { label: "Per Hour", value: "hourly" },
  { label: "Per Day", value: "daily" },
  { label: "Per Week", value: "weekly" },
  { label: "Per Month", value: "monthly" },
];

export default function AddServiceScreen({
  afterSubmit,
}: {
  afterSubmit: () => void;
}) {
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

  const [errCost, setErrCost] = useState<string | null>(null);
  const [errContact, setErrContact] = useState<string | null>(null);

  const fetchServiceTypes = async () => {
    try {
      const response = await serviceTypesApi.getAll();
      const data = await response.data;
      setServiceItems(data.map((s: any) => ({ label: s.name, value: s.id })));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchServiceTypes();
  }, []);

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
      const payload = {
        providerId: await AsyncStorage.getItem("userId"),
        serviceTypeIds: selectedServices,
        rateType: selectedRate,
        amount: costVal,
        contactNumber: phoneOnly,
        currency: "INR",
      };

      const response = await serviceprovidersApi.createService(payload);

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
              listMode="SCROLLVIEW"
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
              listMode="SCROLLVIEW"
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
            onChangeText={setCost}
          />
          {errCost && <Text style={styles.errText}>{errCost}</Text>}

          <Text style={styles.sectionLabel}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Active Contact Number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
            maxLength={15}
          />
          {errContact && <Text style={styles.errText}>{errContact}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.button, posting && { opacity: 0.7 }]}
          onPress={validateAndSubmit}
          disabled={posting}
        >
          {posting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🚀 Post Service</Text>
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
