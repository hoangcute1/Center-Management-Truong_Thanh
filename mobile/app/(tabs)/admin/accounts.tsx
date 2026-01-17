import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";

type UserRole = "student" | "parent" | "teacher" | "admin";

interface User {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

const roleTabs: {
  key: UserRole | "all";
  label: string;
  icon: any;
  color: string;
}[] = [
  { key: "all", label: "Tất cả", icon: "people", color: "#6366F1" },
  { key: "student", label: "Học sinh", icon: "school", color: "#3B82F6" },
  { key: "parent", label: "Phụ huynh", icon: "people", color: "#10B981" },
  { key: "teacher", label: "Giáo viên", icon: "person", color: "#F59E0B" },
  { key: "admin", label: "Admin", icon: "shield", color: "#8B5CF6" },
];

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case "student":
      return { label: "Học sinh", color: "#3B82F6", bg: "#EFF6FF" };
    case "parent":
      return { label: "Phụ huynh", color: "#10B981", bg: "#D1FAE5" };
    case "teacher":
      return { label: "Giáo viên", color: "#F59E0B", bg: "#FEF3C7" };
    case "admin":
      return { label: "Quản trị", color: "#8B5CF6", bg: "#EDE9FE" };
    default:
      return { label: "Khác", color: "#6B7280", bg: "#F3F4F6" };
  }
};

export default function AccountsManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    parents: 0,
    teachers: 0,
    admins: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedRole !== "all") {
        params.role = selectedRole;
      }

      const response = await api.get("/users", { params });
      const data = response.data.data || response.data || [];
      setUsers(Array.isArray(data) ? data : []);

      // Fetch stats
      if (selectedRole === "all") {
        calculateStats(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: User[]) => {
    const stats = {
      total: data.length,
      students: data.filter((u) => u.role === "student").length,
      parents: data.filter((u) => u.role === "parent").length,
      teachers: data.filter((u) => u.role === "teacher").length,
      admins: data.filter((u) => u.role === "admin").length,
    };
    setStats(stats);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery)
  );

  const handleToggleStatus = async (user: User) => {
    try {
      await api.patch(`/users/${user._id}`, { isActive: !user.isActive });
      Alert.alert(
        "Thành công",
        `Đã ${user.isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản`
      );
      fetchUsers();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể thay đổi trạng thái tài khoản");
    }
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setIsDetailVisible(true);
  };

  const renderUserCard = ({ item: user }: { item: User }) => {
    const badge = getRoleBadge(user.role);

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleViewDetail(user)}
        activeOpacity={0.7}
      >
        <View style={[styles.userAvatar, { backgroundColor: badge.bg }]}>
          <Text style={[styles.userAvatarText, { color: badge.color }]}>
            {user.fullName?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.fullName || "Chưa có tên"}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.phone && <Text style={styles.userPhone}>📞 {user.phone}</Text>}
        </View>

        <View style={styles.userRight}>
          <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.roleBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  user.isActive !== false ? "#10B981" : "#EF4444",
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.header}>
        <Text style={styles.headerTitle}>👥 Quản lý tài khoản</Text>
        <Text style={styles.headerSubtitle}>
          {stats.total} người dùng trong hệ thống
        </Text>
      </LinearGradient>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScrollView}
        contentContainerStyle={styles.statsContainer}
      >
        {[
          { label: "Học sinh", value: stats.students, color: "#3B82F6" },
          { label: "Phụ huynh", value: stats.parents, color: "#10B981" },
          { label: "Giáo viên", value: stats.teachers, color: "#F59E0B" },
          { label: "Admin", value: stats.admins, color: "#8B5CF6" },
        ].map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, { borderColor: stat.color }]}
          >
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên, email hoặc SĐT..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContainer}
      >
        {roleTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.roleTab,
              selectedRole === tab.key && { backgroundColor: tab.color },
            ]}
            onPress={() => setSelectedRole(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={selectedRole === tab.key ? "#FFFFFF" : tab.color}
            />
            <Text
              style={[
                styles.roleTabText,
                selectedRole === tab.key && { color: "#FFFFFF" },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Users List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                Không tìm thấy người dùng nào
              </Text>
            </View>
          )}
        />
      )}

      {/* User Detail Modal */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsDetailVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsDetailVisible(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chi tiết tài khoản</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedUser && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalUserHeader}>
                <View
                  style={[
                    styles.modalAvatar,
                    { backgroundColor: getRoleBadge(selectedUser.role).bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalAvatarText,
                      { color: getRoleBadge(selectedUser.role).color },
                    ]}
                  >
                    {selectedUser.fullName?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
                <Text style={styles.modalUserName}>
                  {selectedUser.fullName}
                </Text>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: getRoleBadge(selectedUser.role).bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      { color: getRoleBadge(selectedUser.role).color },
                    ]}
                  >
                    {getRoleBadge(selectedUser.role).label}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{selectedUser.email}</Text>
                  </View>
                </View>

                {selectedUser.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Số điện thoại</Text>
                      <Text style={styles.infoValue}>{selectedUser.phone}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#6B7280"
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Trạng thái</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color:
                            selectedUser.isActive !== false
                              ? "#10B981"
                              : "#EF4444",
                        },
                      ]}
                    >
                      {selectedUser.isActive !== false
                        ? "Đang hoạt động"
                        : "Đã vô hiệu hóa"}
                    </Text>
                  </View>
                </View>

                {selectedUser.createdAt && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Ngày tạo</Text>
                      <Text style={styles.infoValue}>
                        {new Date(selectedUser.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        selectedUser.isActive !== false ? "#FEE2E2" : "#D1FAE5",
                    },
                  ]}
                  onPress={() => {
                    setIsDetailVisible(false);
                    handleToggleStatus(selectedUser);
                  }}
                >
                  <Ionicons
                    name={
                      selectedUser.isActive !== false
                        ? "close-circle-outline"
                        : "checkmark-circle-outline"
                    }
                    size={20}
                    color={
                      selectedUser.isActive !== false ? "#DC2626" : "#059669"
                    }
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color:
                          selectedUser.isActive !== false
                            ? "#DC2626"
                            : "#059669",
                      },
                    ]}
                  >
                    {selectedUser.isActive !== false
                      ? "Vô hiệu hóa"
                      : "Kích hoạt"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  // Stats
  statsScrollView: {
    marginTop: 16,
  },
  statsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 2,
    marginRight: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },
  // Tabs
  tabsScrollView: {
    marginBottom: 8,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  roleTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  userEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  userRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalUserHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: "700",
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  // Info Section
  infoSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
    marginTop: 2,
  },
  // Actions
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
