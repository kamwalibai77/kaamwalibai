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
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [serviceItems, setServiceItems] = useState([] as any[]);
  const [rateItems] = useState(RATE_OPTIONS);
  const [serviceListExpanded, setServiceListExpanded] = useState(false);
  const [rateTypeExpanded, setRateTypeExpanded] = useState(false);
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [cost, setCost] = useState("");
  const [contactNumber, setContactNumber] = useState("");
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
    <SafeAreaView style={styles.safeArea} edges={[]}>
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
            <Ionicons name="briefcase" size={32} color="#ffffff" />
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
              {selectedServices.length > 0 && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>
                    {selectedServices.length} selected
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setServiceListExpanded(!serviceListExpanded)}
                style={styles.expandButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={serviceListExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6366f1"
                />
              </TouchableOpacity>
            </View>

            {/* Selected Services Chips */}
            {selectedServices.length > 0 && (
              <View style={styles.selectedChipsContainer}>
                {selectedServices.map((serviceId) => {
                  const service = serviceItems.find(
                    (s) => s.value === serviceId
                  );
                  return (
                    <View key={serviceId} style={styles.chip}>
                      <Text style={styles.chipText}>{service?.label}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedServices((prev) =>
                            prev.filter((id) => id !== serviceId)
                          );
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#8b5cf6"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Service Type Selection List */}
            {serviceListExpanded && (
              <View style={styles.serviceListWrapper}>
                {serviceItems.map((service) => {
                  const isSelected = selectedServices.includes(service.value);
                  return (
                    <TouchableOpacity
                      key={service.value}
                      style={[
                        styles.serviceItem,
                        isSelected && styles.serviceItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedServices((prev) => {
                          if (prev.includes(service.value)) {
                            return prev.filter((id) => id !== service.value);
                          }
                          return [...prev, service.value];
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.serviceItemContent}>
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.serviceItemText,
                            isSelected && styles.serviceItemTextSelected,
                          ]}
                        >
                          {service.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#8b5cf6"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Rate Type Card */}
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Ionicons name="time" size={18} color="#6366f1" />
              <Text style={styles.sectionLabel}>Rate Type</Text>
              {selectedRate && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>
                    {rateItems.find((r) => r.value === selectedRate)?.label}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setRateTypeExpanded(!rateTypeExpanded)}
                style={styles.expandButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={rateTypeExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6366f1"
                />
              </TouchableOpacity>
            </View>

            {/* Rate Type Selection Grid */}
            {rateTypeExpanded && (
              <View style={styles.rateTypeGrid}>
                {rateItems.map((rate) => {
                  const isSelected = selectedRate === rate.value;
                  return (
                    <TouchableOpacity
                      key={rate.value}
                      style={[
                        styles.rateTypeItem,
                        isSelected && styles.rateTypeItemSelected,
                      ]}
                      onPress={() => setSelectedRate(rate.value)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.radioButton,
                          isSelected && styles.radioButtonSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text
                        style={[
                          styles.rateTypeText,
                          isSelected && styles.rateTypeTextSelected,
                        ]}
                      >
                        {rate.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
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
              <Text style={styles.optionalText}>(Optional)</Text>
              {selectedAvailability.length > 0 && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>
                    {selectedAvailability.length} selected
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setAvailabilityExpanded(!availabilityExpanded)}
                style={styles.expandButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={availabilityExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6366f1"
                />
              </TouchableOpacity>
            </View>

            {/* Selected Availability Chips */}
            {selectedAvailability.length > 0 && (
              <View style={styles.selectedChipsContainer}>
                {selectedAvailability.map((slotValue) => {
                  const slot = availabilityItems.find(
                    (s) => s.value === slotValue
                  );
                  return (
                    <View key={slotValue} style={styles.chip}>
                      <Text style={styles.chipText}>{slot?.label}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedAvailability((prev) =>
                            prev.filter((v) => v !== slotValue)
                          );
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#8b5cf6"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Availability Slots Grid */}
            {availabilityExpanded && (
              <View style={styles.availabilityGrid}>
                {availabilityItems.map((slot) => {
                  const isSelected = selectedAvailability.includes(slot.value);
                  return (
                    <TouchableOpacity
                      key={slot.value}
                      style={[
                        styles.availabilitySlot,
                        isSelected && styles.availabilitySlotSelected,
                      ]}
                      onPress={() => {
                        setSelectedAvailability((prev) => {
                          if (prev.includes(slot.value)) {
                            return prev.filter((v) => v !== slot.value);
                          }
                          return [...prev, slot.value];
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          slot.value === "morning"
                            ? "sunny"
                            : slot.value === "afternoon"
                            ? "partly-sunny"
                            : slot.value === "evening"
                            ? "moon"
                            : "moon-outline"
                        }
                        size={20}
                        color={isSelected ? "#8b5cf6" : "#94a3b8"}
                      />
                      <Text
                        style={[
                          styles.availabilityText,
                          isSelected && styles.availabilityTextSelected,
                        ]}
                      >
                        {slot.label}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#8b5cf6"
                          style={styles.availabilityCheck}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
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
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 12,
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
    flex: 1,
  },
  expandButton: {
    padding: 4,
    marginLeft: 8,
  },
  expandButton: {
    padding: 4,
    marginLeft: 8,
  },
  selectedBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
  },
  selectedChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e9d5ff",
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366f1",
  },
  serviceListWrapper: {
    maxHeight: "auto",
  },
  serviceListContainer: {
    flex: 1,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  serviceItemSelected: {
    backgroundColor: "#f5f3ff",
    borderColor: "#8b5cf6",
    borderWidth: 2,
  },
  serviceItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },
  serviceItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#475569",
  },
  serviceItemTextSelected: {
    color: "#1e293b",
    fontWeight: "600",
  },
  rateTypeGrid: {
    gap: 10,
  },
  rateTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  rateTypeItemSelected: {
    backgroundColor: "#f5f3ff",
    borderColor: "#8b5cf6",
    borderWidth: 2,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  radioButtonSelected: {
    borderColor: "#8b5cf6",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#8b5cf6",
  },
  rateTypeText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#475569",
    flex: 1,
  },
  rateTypeTextSelected: {
    color: "#1e293b",
    fontWeight: "600",
  },
  optionalText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginLeft: 6,
  },
  availabilityGrid: {
    gap: 10,
  },
  availabilitySlot: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  availabilitySlotSelected: {
    backgroundColor: "#f5f3ff",
    borderColor: "#8b5cf6",
    borderWidth: 2,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    flex: 1,
  },
  availabilityTextSelected: {
    color: "#1e293b",
    fontWeight: "600",
  },
  availabilityCheck: {
    marginLeft: "auto",
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
