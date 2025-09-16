// app/screens/PostServiceScreen.tsx
import React, { useState } from "react";
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
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const SERVICE_TYPES = [
  "Cooking",
  "Cleaning",
  "Laundry",
  "Utensils",
  "Home Care",
  "Baby Care",
  "Massage",
  "Care Taker",
  "Gardener",
  "Driver",
  "Electrician",
  "Plumber",
  "Security Guard",
  "Beautician",
];

const RATE_OPTIONS = ["Per Hour", "Per Day", "Per Week", "Per Month"];

export default function AddServiceScreen() {
  // open states (important to manage overlap)
  const [servicesOpen, setServicesOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  // items (DropDownPicker expects items + setItems if dynamic)
  const [serviceItems, setServiceItems] = useState(
    SERVICE_TYPES.map((s) => ({ label: s, value: s }))
  );
  const [rateItems, setRateItems] = useState(
    RATE_OPTIONS.map((r) => ({ label: r, value: r }))
  );

  // values
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [cost, setCost] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // validation errors
  const [errCost, setErrCost] = useState<string | null>(null);
  const [errContact, setErrContact] = useState<string | null>(null);

  // When one dropdown opens, close the other to avoid overlap/touch issues
  const onOpenServices = () => {
    setRateOpen(false);
  };
  const onOpenRate = () => {
    setServicesOpen(false);
  };

  const closeDropdowns = () => {
    if (servicesOpen) setServicesOpen(false);
    if (rateOpen) setRateOpen(false);
    Keyboard.dismiss(); // also closes keyboard when tapping outside
  };

  const validateAndSubmit = () => {
    Keyboard.dismiss();
    let valid = true;
    setErrCost(null);
    setErrContact(null);

    // cost must be a positive number
    const costVal = parseFloat(cost);
    if (!cost || isNaN(costVal) || costVal <= 0) {
      setErrCost("Enter a valid cost (numeric, > 0).");
      valid = false;
    }

    // contact number basic validation (10 digits)
    const phoneOnly = contactNumber.replace(/\D/g, "");
    if (phoneOnly.length !== 10) {
      setErrContact("Enter a valid 10-digit phone number.");
      valid = false;
    }

    if (!valid) {
      return;
    }

    // prepare payload
    const payload = {
      services: selectedServices,
      rateType: selectedRate,
      cost: costVal,
      contactNumber: phoneOnly,
    };

    // replace with API call if required
    console.log("Post Service payload:", payload);
    Alert.alert("Success", "Service posted (mock). Check console for payload.");
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
        <Text style={styles.title}>Post Your Services</Text>

        {/* Services dropdown wrapper: set high zIndex so the dropdown appears above other elements */}
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
            multiple={true}
            min={1}
            max={SERVICE_TYPES.length}
            value={selectedServices}
            setValue={setSelectedServices}
            items={serviceItems}
            setItems={setServiceItems}
            placeholder="Select Services"
            listMode="SCROLLVIEW"
            dropDownDirection="AUTO"
            // dropDown container must have elevation for Android + zIndex for iOS
            dropDownContainerStyle={styles.dropDownContainer}
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            scrollViewProps={{ nestedScrollEnabled: true }}
          />
        </View>

        {/* Rate dropdown wrapper (lower zIndex than services) */}
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

        {/* Cost */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter Cost"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={cost}
            onChangeText={(t) => setCost(t)}
            returnKeyType="done"
          />
          {errCost ? <Text style={styles.errText}>{errCost}</Text> : null}
        </View>

        {/* Contact Number */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Active Contact Number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={(t) => setContactNumber(t)}
            maxLength={15} // allow international formatting but validated to 10 digits
            returnKeyType="done"
          />
          {errContact ? <Text style={styles.errText}>{errContact}</Text> : null}
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.button} onPress={validateAndSubmit}>
          <Text style={styles.buttonText}>Post Service</Text>
        </TouchableOpacity>

        {/* Extra bottom space so dropdowns can expand without being cut off */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    paddingBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
    color: "#111827",
    textAlign: "center",
  },
  dropdownWrapper: {
    marginBottom: 14,
    // relative positioning helps zIndex behave as expected on iOS
    position: "relative",
  },
  dropdown: {
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 14,
    color: "#111827",
  },
  dropDownContainer: {
    borderColor: "#e5e7eb",
    borderRadius: 10,
    maxHeight: 200,
    // Android elevation for the list overlay
    elevation: 8,
    // iOS zIndex is handled by wrapper above
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  inputWrap: {
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
  },
  errText: {
    color: "#dc2626",
    marginTop: 6,
    fontSize: 13,
  },
  button: {
    backgroundColor: "#6366f1",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
