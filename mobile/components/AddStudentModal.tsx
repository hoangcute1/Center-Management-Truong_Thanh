"use client";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "@/lib/api";
import { useBranchesStore } from "@/lib/stores/branches-store";

// Loại học bổng
export type ScholarshipType = "teacher_child" | "poor_family" | "orphan";

export const SCHOLARSHIP_TYPES: { value: ScholarshipType; label: string }[] = [
  { value: "teacher_child", label: "Con giáo viên" },
  { value: "poor_family", label: "Hộ nghèo" },
  { value: "orphan", label: "Con mồ côi" },
];

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  branchId: string;
  parentName: string;
  hasScholarship: boolean;
  scholarshipType: ScholarshipType | "";
  scholarshipPercent: number;
}

const initialFormData: FormData = {
  fullName: "",
  email: "",
  phone: "",
  branchId: "",
  parentName: "",
  hasScholarship: false,
  scholarshipType: "",
  scholarshipPercent: 0,
};

export default function AddStudentModal({
  visible,
  onClose,
  onSuccess,
}: AddStudentModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showScholarshipTypePicker, setShowScholarshipTypePicker] =
    useState(false);

  const { branches, fetchBranches } = useBranchesStore();

  useEffect(() => {
    if (visible) {
      fetchBranches();
      setFormData(initialFormData);
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate
      if (!formData.branchId) {
        throw new Error("Vui lòng chọn chi nhánh");
      }
      if (!formData.fullName.trim()) {
        throw new Error("Vui lòng nhập họ tên");
      }
      if (!formData.email.trim()) {
        throw new Error("Vui lòng nhập email");
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error("Email không hợp lệ");
      }

      // Validate scholarship
      if (formData.hasScholarship && !formData.scholarshipType) {
        throw new Error("Vui lòng chọn loại học bổng");
      }

      // Prepare API data
      const apiData: any = {
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined,
        password: "123456",
        role: "student",
        branchId: formData.branchId,
        parentName: formData.parentName || undefined,
        hasScholarship: formData.hasScholarship,
      };

      // Add scholarship info
      if (formData.hasScholarship && formData.scholarshipType) {
        apiData.scholarshipType = formData.scholarshipType;
        apiData.scholarshipPercent = formData.scholarshipPercent;
      }

      await api.post("/users", apiData);
      onSuccess();
      onClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Đã có lỗi xảy ra khi tạo học sinh";
      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBranch = branches.find((b) => b._id === formData.branchId);
  const selectedScholarshipType = SCHOLARSHIP_TYPES.find(
    (t) => t.value === formData.scholarshipType
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Thêm học sinh mới</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Branch Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Chi nhánh <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowBranchPicker(!showBranchPicker)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !selectedBranch && styles.placeholderText,
                  ]}
                >
                  {selectedBranch?.name || "-- Chọn chi nhánh --"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
              {showBranchPicker && (
                <View style={styles.pickerOptions}>
                  {branches.map((branch) => (
                    <TouchableOpacity
                      key={branch._id}
                      style={[
                        styles.pickerOption,
                        formData.branchId === branch._id &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, branchId: branch._id });
                        setShowBranchPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.branchId === branch._id &&
                            styles.pickerOptionTextSelected,
                        ]}
                      >
                        {branch.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Họ tên <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
                placeholder="Nhập họ tên học sinh"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                placeholder="Nhập email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            {/* Parent Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên phụ huynh</Text>
              <TextInput
                style={styles.input}
                value={formData.parentName}
                onChangeText={(text) =>
                  setFormData({ ...formData, parentName: text })
                }
                placeholder="Nhập tên phụ huynh"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Scholarship Section */}
            <View style={styles.scholarshipSection}>
              <View style={styles.scholarshipHeader}>
                <Text style={styles.label}>Học bổng</Text>
                <Switch
                  value={formData.hasScholarship}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      hasScholarship: value,
                      scholarshipType: value ? formData.scholarshipType : "",
                      scholarshipPercent: value ? formData.scholarshipPercent : 0,
                    })
                  }
                  trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
                  thumbColor={formData.hasScholarship ? "#3B82F6" : "#F9FAFB"}
                />
              </View>

              {formData.hasScholarship && (
                <View style={styles.scholarshipDetails}>
                  {/* Scholarship Type */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Loại học bổng <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() =>
                        setShowScholarshipTypePicker(!showScholarshipTypePicker)
                      }
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          !selectedScholarshipType && styles.placeholderText,
                        ]}
                      >
                        {selectedScholarshipType?.label ||
                          "-- Chọn loại học bổng --"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    {showScholarshipTypePicker && (
                      <View style={styles.pickerOptions}>
                        {SCHOLARSHIP_TYPES.map((type) => (
                          <TouchableOpacity
                            key={type.value}
                            style={[
                              styles.pickerOption,
                              formData.scholarshipType === type.value &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => {
                              setFormData({
                                ...formData,
                                scholarshipType: type.value,
                              });
                              setShowScholarshipTypePicker(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                formData.scholarshipType === type.value &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {type.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Scholarship Percent */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phần trăm học bổng (%)</Text>
                    <View style={styles.percentContainer}>
                      <View style={styles.sliderContainer}>
                        <View style={styles.sliderTrack}>
                          <View
                            style={[
                              styles.sliderFill,
                              { width: `${formData.scholarshipPercent}%` },
                            ]}
                          />
                        </View>
                        <View style={styles.sliderLabels}>
                          {[0, 25, 50, 75, 100].map((val) => (
                            <TouchableOpacity
                              key={val}
                              onPress={() =>
                                setFormData({
                                  ...formData,
                                  scholarshipPercent: val,
                                })
                              }
                            >
                              <Text
                                style={[
                                  styles.sliderLabel,
                                  formData.scholarshipPercent === val &&
                                    styles.sliderLabelActive,
                                ]}
                              >
                                {val}%
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <TextInput
                        style={styles.percentInput}
                        value={formData.scholarshipPercent.toString()}
                        onChangeText={(text) => {
                          const value = Math.min(
                            100,
                            Math.max(0, parseInt(text) || 0)
                          );
                          setFormData({
                            ...formData,
                            scholarshipPercent: value,
                          });
                        }}
                        keyboardType="numeric"
                        maxLength={3}
                      />
                      <Text style={styles.percentSign}>%</Text>
                    </View>
                    <Text style={styles.percentNote}>
                      Học bổng hiện tại: {formData.scholarshipPercent}% giảm học
                      phí
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Thêm học sinh</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#DC2626",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  pickerText: {
    fontSize: 15,
    color: "#1F2937",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  pickerOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionSelected: {
    backgroundColor: "#EFF6FF",
  },
  pickerOptionText: {
    fontSize: 15,
    color: "#374151",
  },
  pickerOptionTextSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  scholarshipSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scholarshipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scholarshipDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  percentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sliderContainer: {
    flex: 1,
    marginRight: 16,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sliderLabelActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  percentInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
    width: 60,
    textAlign: "center",
  },
  percentSign: {
    fontSize: 15,
    color: "#6B7280",
    marginLeft: 4,
  },
  percentNote: {
    fontSize: 13,
    color: "#3B82F6",
    marginTop: 8,
    fontStyle: "italic",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#DC2626",
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});
