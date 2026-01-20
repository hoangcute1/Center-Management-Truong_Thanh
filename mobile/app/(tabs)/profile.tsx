import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/lib/stores";
import api from "@/lib/api";

const { width } = Dimensions.get("window");

const getRoleConfig = (role: string) => {
  switch (role) {
    case "student":
      return {
        label: "Học sinh",
        colors: ["#3B82F6", "#2563EB"],
        icon: "school",
      };
    case "teacher":
      return {
        label: "Giáo viên",
        colors: ["#10B981", "#059669"],
        icon: "person",
      };
    case "parent":
      return {
        label: "Phụ huynh",
        colors: ["#F59E0B", "#D97706"],
        icon: "people",
      };
    case "admin":
      return {
        label: "Quản trị viên",
        colors: ["#8B5CF6", "#7C3AED"],
        icon: "settings",
      };
    default:
      return { label: role, colors: ["#6B7280", "#4B5563"], icon: "person" };
  }
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const roleConfig = getRoleConfig(user?.role || "");

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Theme setting
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên");
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch(`/users/${user?._id}`, {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim() || undefined,
      });

      // Update local state
      if (updateUser) {
        updateUser({
          ...user!,
          fullName: profileForm.fullName.trim(),
          phone: profileForm.phone.trim(),
        });
      }

      Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân");
      setShowProfileModal(false);
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể cập nhật thông tin",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert("Lỗi", "Xác nhận mật khẩu không khớp");
      return;
    }

    setIsUpdating(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      Alert.alert("Thành công", "Đã đổi mật khẩu thành công");
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể đổi mật khẩu",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const menuSections = [
    {
      title: "Tài khoản",
      items: [
        {
          icon: "person-outline" as const,
          label: "Thông tin cá nhân",
          color: "#3B82F6",
          onPress: () => {
            setProfileForm({
              fullName: user?.fullName || "",
              phone: user?.phone || "",
            });
            setShowProfileModal(true);
          },
        },
        {
          icon: "lock-closed-outline" as const,
          label: "Đổi mật khẩu",
          color: "#8B5CF6",
          onPress: () => setShowPasswordModal(true),
        },
      ],
    },
    {
      title: "Cài đặt",
      items: [
        {
          icon: "notifications-outline" as const,
          label: "Cài đặt thông báo",
          color: "#F59E0B",
          onPress: () => {},
        },
        {
          icon: "moon-outline" as const,
          label: "Giao diện",
          color: "#6366F1",
          onPress: () => setShowThemeModal(true),
        },
      ],
    },
    {
      title: "Hỗ trợ",
      items: [
        {
          icon: "help-circle-outline" as const,
          label: "Trợ giúp",
          color: "#10B981",
          onPress: () => {},
        },
        {
          icon: "chatbubble-outline" as const,
          label: "Liên hệ hỗ trợ",
          color: "#EC4899",
          onPress: () => {},
        },
        {
          icon: "information-circle-outline" as const,
          label: "Về ứng dụng",
          color: "#6B7280",
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={roleConfig.colors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileGradient}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={48} color={roleConfig.colors[0]} />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.fullName || "Người dùng"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={roleConfig.icon as any} size={12} color="#FFFFFF" />
            <Text style={styles.roleText}>{roleConfig.label}</Text>
          </View>
        </LinearGradient>

        {/* User Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="mail-outline" size={18} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoText}>
                {user?.email || "Chưa cập nhật"}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="call-outline" size={18} color="#10B981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoText}>
                {user?.phone || "Chưa cập nhật"}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuIconBg,
                      { backgroundColor: `${item.color}15` },
                    ]}
                  >
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#FEE2E2", "#FECACA"]}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Giáo dục Trường Thành</Text>
          <Text style={styles.versionNumber}>Phiên bản 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thông tin cá nhân</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.formLabel}>Họ và tên</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.formInput}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#9CA3AF"
                value={profileForm.fullName}
                onChangeText={(text) =>
                  setProfileForm((prev) => ({ ...prev, fullName: text }))
                }
              />
            </View>

            <Text style={styles.formLabel}>Email</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                style={[styles.formInput, styles.inputTextDisabled]}
                value={user?.email || ""}
                editable={false}
              />
            </View>

            <Text style={styles.formLabel}>Số điện thoại</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.formInput}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={profileForm.phone}
                onChangeText={(text) =>
                  setProfileForm((prev) => ({ ...prev, phone: text }))
                }
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isUpdating && styles.submitButtonDisabled,
              ]}
              onPress={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.formLabel}>Mật khẩu hiện tại</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.formInput}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={passwordForm.currentPassword}
                onChangeText={(text) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: text,
                  }))
                }
              />
            </View>

            <Text style={styles.formLabel}>Mật khẩu mới</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.formInput}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={passwordForm.newPassword}
                onChangeText={(text) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: text }))
                }
              />
            </View>

            <Text style={styles.formLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#6B7280"
              />
              <TextInput
                style={styles.formInput}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={passwordForm.confirmPassword}
                onChangeText={(text) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: text,
                  }))
                }
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: "#8B5CF6" },
                isUpdating && styles.submitButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="key" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowThemeModal(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Giao diện</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.themeOption}>
              <View style={styles.themeOptionLeft}>
                <View
                  style={[styles.themeIconBg, { backgroundColor: "#FEF3C7" }]}
                >
                  <Ionicons name="sunny" size={24} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.themeOptionTitle}>Chế độ sáng</Text>
                  <Text style={styles.themeOptionDesc}>Giao diện mặc định</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.themeRadio,
                  !isDarkMode && styles.themeRadioActive,
                ]}
                onPress={() => setIsDarkMode(false)}
              >
                {!isDarkMode && <View style={styles.themeRadioInner} />}
              </TouchableOpacity>
            </View>

            <View style={styles.themeOption}>
              <View style={styles.themeOptionLeft}>
                <View
                  style={[styles.themeIconBg, { backgroundColor: "#E0E7FF" }]}
                >
                  <Ionicons name="moon" size={24} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.themeOptionTitle}>Chế độ tối</Text>
                  <Text style={styles.themeOptionDesc}>
                    Bảo vệ mắt khi trời tối
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.themeRadio,
                  isDarkMode && styles.themeRadioActive,
                ]}
                onPress={() => setIsDarkMode(true)}
              >
                {isDarkMode && <View style={styles.themeRadioInner} />}
              </TouchableOpacity>
            </View>


          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  profileGradient: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  menuSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    gap: 10,
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
  },
  formInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#1F2937",
  },
  inputTextDisabled: {
    color: "#9CA3AF",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Theme styles
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  themeOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  themeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  themeOptionDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  themeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  themeRadioActive: {
    borderColor: "#3B82F6",
  },
  themeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
  },
  themeNote: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 24,
    fontStyle: "italic",
  },
});
