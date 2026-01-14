import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuthStore, useBranchesStore } from "@/lib/stores";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Role configuration matching web
const ROLE_CONFIG = {
  student: {
    label: "Học sinh",
    icon: "school" as const,
    colors: ["#3B82F6", "#2563EB"] as const,
  },
  teacher: {
    label: "Giáo viên",
    icon: "person" as const,
    colors: ["#10B981", "#059669"] as const,
  },
  parent: {
    label: "Phụ huynh",
    icon: "people" as const,
    colors: ["#F59E0B", "#D97706"] as const,
  },
  admin: {
    label: "Quản trị",
    icon: "settings" as const,
    colors: ["#8B5CF6", "#7C3AED"] as const,
  },
};

type Role = keyof typeof ROLE_CONFIG;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const { login, isLoading, error } = useAuthStore();
  const {
    branches,
    selectedBranch,
    fetchBranches,
    selectBranch,
    isLoading: branchesLoading,
  } = useBranchesStore();

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu");
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Đăng nhập thất bại", err.message);
    }
  };

  // Branch selection modal
  const BranchModal = () => (
    <Modal
      visible={showBranchModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBranchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn cơ sở</Text>
            <TouchableOpacity onPress={() => setShowBranchModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.branchList}>
            <TouchableOpacity
              style={[
                styles.branchItem,
                !selectedBranch && styles.branchItemSelected,
              ]}
              onPress={() => {
                selectBranch(null);
                setShowBranchModal(false);
              }}
            >
              <View style={styles.branchItemContent}>
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={!selectedBranch ? "#3B82F6" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.branchItemText,
                    !selectedBranch && styles.branchItemTextSelected,
                  ]}
                >
                  Tất cả cơ sở
                </Text>
              </View>
              {!selectedBranch && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>

            {branches.map((branch) => (
              <TouchableOpacity
                key={branch._id}
                style={[
                  styles.branchItem,
                  selectedBranch?._id === branch._id &&
                    styles.branchItemSelected,
                ]}
                onPress={() => {
                  selectBranch(branch);
                  setShowBranchModal(false);
                }}
              >
                <View style={styles.branchItemContent}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={
                      selectedBranch?._id === branch._id ? "#3B82F6" : "#6B7280"
                    }
                  />
                  <View>
                    <Text
                      style={[
                        styles.branchItemText,
                        selectedBranch?._id === branch._id &&
                          styles.branchItemTextSelected,
                      ]}
                    >
                      {branch.name}
                    </Text>
                    {branch.address && (
                      <Text style={styles.branchItemAddress}>
                        {branch.address}
                      </Text>
                    )}
                  </View>
                </View>
                {selectedBranch?._id === branch._id && (
                  <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="school" size={40} color="#3B82F6" />
              </View>
            </View>
            <Text style={styles.title}>Giáo dục Trường Thành</Text>
            <Text style={styles.subtitle}>Hệ thống quản lý trung tâm</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Đăng nhập</Text>
            <Text style={styles.formSubtitle}>
              Chọn cơ sở và nhập thông tin đăng nhập
            </Text>

            {/* Branch Selector */}
            <Text style={styles.sectionLabel}>Cơ sở</Text>
            <TouchableOpacity
              style={styles.branchSelector}
              onPress={() => setShowBranchModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.branchSelectorContent}>
                <Ionicons name="business-outline" size={20} color="#6B7280" />
                <Text style={styles.branchSelectorText}>
                  {selectedBranch?.name || "Tất cả cơ sở"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* Role Selection */}
            <Text style={styles.sectionLabel}>Chọn vai trò</Text>
            <View style={styles.roleGrid}>
              {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
                const config = ROLE_CONFIG[role];
                const isSelected = selectedRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleCard,
                      isSelected && styles.roleCardSelected,
                    ]}
                    onPress={() => setSelectedRole(role)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        isSelected ? config.colors : ["#F3F4F6", "#E5E7EB"]
                      }
                      style={styles.roleIconBg}
                    >
                      <Ionicons
                        name={config.icon}
                        size={22}
                        color={isSelected ? "#FFFFFF" : "#6B7280"}
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        styles.roleLabel,
                        isSelected && styles.roleLabelSelected,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Email Input */}
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#3B82F6", "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Help Links */}
            <View style={styles.helpLinks}>
              <TouchableOpacity style={styles.helpLink}>
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color="#6B7280"
                />
                <Text style={styles.helpLinkText}>Trợ giúp</Text>
              </TouchableOpacity>
              <View style={styles.helpDivider} />
              <TouchableOpacity style={styles.helpLink}>
                <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                <Text style={styles.helpLinkText}>Liên hệ admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 Giáo dục Trường Thành</Text>
            <Text style={styles.footerVersion}>Phiên bản 1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Branch Modal */}
      <BranchModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: -36,
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  branchSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  branchSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  branchSelectorText: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 20,
  },
  roleCard: {
    width: (width - 92) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 14,
    margin: 6,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  roleCardSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  roleIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  roleLabelSelected: {
    color: "#3B82F6",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  loginButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  loginGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    gap: 10,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  helpLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  helpLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  helpLinkText: {
    fontSize: 14,
    color: "#6B7280",
  },
  helpDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E7EB",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "70%",
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  branchList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  branchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  branchItemSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  branchItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  branchItemText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  branchItemTextSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  branchItemAddress: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
});
