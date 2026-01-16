import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useAuthStore,
  useClassesStore,
  useIncidentsStore,
  useBranchesStore,
} from "@/lib/stores";
import { router } from "expo-router";
import api from "@/lib/api";

const { width } = Dimensions.get("window");

// Overview stats matching web
const overviewStats = [
  {
    label: "Học sinh",
    value: "248",
    trend: "+12% so với tháng trước",
    icon: "people" as const,
    colors: ["#3B82F6", "#2563EB"],
  },
  {
    label: "Giáo viên",
    value: "18",
    trend: "Hoạt động",
    icon: "person" as const,
    colors: ["#10B981", "#059669"],
  },
  {
    label: "Doanh thu",
    value: "75 Tr",
    trend: "+29% so với tháng trước",
    icon: "cash" as const,
    colors: ["#F59E0B", "#D97706"],
  },
  {
    label: "Khóa học",
    value: "12",
    trend: "Đang mở",
    icon: "book" as const,
    colors: ["#8B5CF6", "#7C3AED"],
  },
];

// Admin menu items matching web tabs
const adminMenuItems = [
  {
    id: "overview",
    icon: "stats-chart" as const,
    label: "Tổng quan",
    subtitle: "Thống kê hệ thống",
    colors: ["#3B82F6", "#2563EB"],
  },
  {
    id: "courses",
    icon: "book" as const,
    label: "Khóa học",
    subtitle: "Quản lý lớp học",
    colors: ["#10B981", "#059669"],
    onPress: () => router.push("/(tabs)/classes"),
  },
  {
    id: "accounts",
    icon: "people" as const,
    label: "Tài khoản",
    subtitle: "Quản lý người dùng",
    colors: ["#6366F1", "#4F46E5"],
    onPress: () => router.push("/(tabs)/admin/accounts"),
  },
  {
    id: "schedule",
    icon: "calendar" as const,
    label: "Lịch dạy học",
    subtitle: "Quản lý lịch học",
    colors: ["#EC4899", "#DB2777"],
    onPress: () => router.push("/(tabs)/schedule"),
  },
  {
    id: "attendance",
    icon: "checkbox" as const,
    label: "Điểm danh",
    subtitle: "Quản lý điểm danh",
    colors: ["#14B8A6", "#0D9488"],
    onPress: () => router.push("/(tabs)/admin/attendance"),
  },
  {
    id: "payments",
    icon: "card" as const,
    label: "Thanh toán",
    subtitle: "Quản lý thu chi",
    colors: ["#22C55E", "#16A34A"],
    onPress: () => router.push("/(tabs)/admin/payments"),
  },
  {
    id: "incidents",
    icon: "warning" as const,
    label: "Sự cố",
    subtitle: "Xử lý báo cáo",
    colors: ["#F97316", "#EA580C"],
    onPress: () => router.push("/(tabs)/admin/incidents"),
  },
  {
    id: "branches",
    icon: "business" as const,
    label: "Cơ sở",
    subtitle: "Quản lý chi nhánh",
    colors: ["#8B5CF6", "#7C3AED"],
    onPress: () => router.push("/(tabs)/admin/branches"),
  },
];

// Quick stats for finance
const financeStats = [
  {
    label: "Tổng doanh thu",
    value: "720 Tr",
    color: "#10B981",
    icon: "trending-up",
  },
  {
    label: "Chi phí",
    value: "185 Tr",
    color: "#EF4444",
    icon: "trending-down",
  },
  { label: "Lợi nhuận", value: "535 Tr", color: "#3B82F6", icon: "diamond" },
];

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const {
    classes,
    fetchClasses,
    isLoading: classesLoading,
  } = useClassesStore();
  const {
    incidents,
    fetchIncidents,
    isLoading: incidentsLoading,
  } = useIncidentsStore();
  const { branches, fetchBranches } = useBranchesStore();

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
        fetchIncidents(),
        fetchBranches(),
        fetchUserStats(),
      ]);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserStats = async () => {
    try {
      // Fetch user counts by role
      const [studentsRes, teachersRes, parentsRes] = await Promise.all([
        api.get("/users?role=student&limit=1"),
        api.get("/users?role=teacher&limit=1"),
        api.get("/users?role=parent&limit=1"),
      ]);

      setStats({
        students: studentsRes.data.total || studentsRes.data.length || 0,
        teachers: teachersRes.data.total || teachersRes.data.length || 0,
        parents: parentsRes.data.total || parentsRes.data.length || 0,
        totalUsers:
          (studentsRes.data.total || 0) +
          (teachersRes.data.total || 0) +
          (parentsRes.data.total || 0),
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const onRefresh = async () => {
    await loadData();
  };

  // Calculate dynamic stats
  const pendingIncidents = incidents.filter(
    (i) => i.status === "pending" || i.status === "in_progress"
  ).length;

  const dynamicOverviewStats = [
    {
      label: "Học sinh",
      value: stats.students.toString(),
      trend: "Tổng số",
      icon: "people" as const,
      colors: ["#3B82F6", "#2563EB"],
    },
    {
      label: "Giáo viên",
      value: stats.teachers.toString(),
      trend: "Đang hoạt động",
      icon: "person" as const,
      colors: ["#10B981", "#059669"],
    },
    {
      label: "Khóa học",
      value: classes.length.toString(),
      trend: "Đang mở",
      icon: "book" as const,
      colors: ["#F59E0B", "#D97706"],
    },
    {
      label: "Sự cố",
      value: pendingIncidents.toString(),
      trend: "Chờ xử lý",
      icon: "warning" as const,
      colors:
        pendingIncidents > 0 ? ["#EF4444", "#DC2626"] : ["#8B5CF6", "#7C3AED"],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || classesLoading || incidentsLoading}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <LinearGradient
          colors={["#8B5CF6", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeGradient}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeGreeting}>Xin chào Admin 👋</Text>
              <Text style={styles.welcomeName}>
                {user?.fullName || "Quản trị viên"}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Chào mừng bạn quay trở lại bảng điều khiển!
              </Text>
            </View>
            <View style={styles.welcomeIconBg}>
              <Ionicons
                name="shield-checkmark"
                size={40}
                color="rgba(255,255,255,0.3)"
              />
            </View>
          </View>
        </LinearGradient>

        {/* Overview Stats Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Tổng quan hệ thống</Text>
          <View style={styles.statsGrid}>
            {dynamicOverviewStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <LinearGradient
                  colors={stat.colors as [string, string]}
                  style={styles.statCardGradient}
                >
                  <Ionicons name={stat.icon} size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statTrend}>{stat.trend}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Quản lý hệ thống</Text>
          <View style={styles.menuGrid}>
            {adminMenuItems.slice(1).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={item.colors as [string, string]}
                  style={styles.menuIconBg}
                >
                  <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Finance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Tài chính</Text>
          <View style={styles.financeCard}>
            {financeStats.map((stat, index) => (
              <View key={index} style={styles.financeItem}>
                <View
                  style={[
                    styles.financeIconBg,
                    { backgroundColor: `${stat.color}20` },
                  ]}
                >
                  <Ionicons
                    name={stat.icon as any}
                    size={20}
                    color={stat.color}
                  />
                </View>
                <View style={styles.financeInfo}>
                  <Text style={styles.financeLabel}>{stat.label}</Text>
                  <Text style={[styles.financeValue, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Lớp học gần đây</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/classes")}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {classes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="school-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>Chưa có lớp học nào</Text>
            </View>
          ) : (
            classes.slice(0, 3).map((cls, index) => (
              <TouchableOpacity
                key={cls._id}
                style={styles.classItem}
                onPress={() => router.push("/(tabs)/classes")}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    index % 3 === 0
                      ? ["#3B82F6", "#2563EB"]
                      : index % 3 === 1
                      ? ["#10B981", "#059669"]
                      : ["#F59E0B", "#D97706"]
                  }
                  style={styles.classIcon}
                >
                  <Ionicons name="book" size={18} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classSubject}>
                    {cls.subject} • {cls.studentIds?.length || 0} học sinh
                  </Text>
                </View>
                <View
                  style={[
                    styles.classBadge,
                    cls.isActive ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <Text
                    style={
                      cls.isActive
                        ? styles.activeBadgeText
                        : styles.inactiveBadgeText
                    }
                  >
                    {cls.isActive ? "Hoạt động" : "Đã kết thúc"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Pending Incidents */}
        {pendingIncidents > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🐛 Sự cố chờ xử lý</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/admin/incidents")}
                style={styles.seeAllButton}
              >
                <Text style={styles.seeAllText}>Xem tất cả</Text>
                <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            <View style={styles.incidentAlert}>
              <LinearGradient
                colors={["#FEE2E2", "#FECACA"]}
                style={styles.incidentAlertGradient}
              >
                <View style={styles.incidentAlertIcon}>
                  <Ionicons name="warning" size={24} color="#DC2626" />
                </View>
                <View style={styles.incidentAlertInfo}>
                  <Text style={styles.incidentAlertTitle}>
                    {pendingIncidents} sự cố cần xử lý
                  </Text>
                  <Text style={styles.incidentAlertSubtitle}>
                    Vui lòng kiểm tra và xử lý các báo cáo từ người dùng
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#DC2626" />
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Branches Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏢 Cơ sở</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/admin/branches")}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Quản lý</Text>
              <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          <View style={styles.branchesCard}>
            <View style={styles.branchesInfo}>
              <Text style={styles.branchesCount}>{branches.length}</Text>
              <Text style={styles.branchesLabel}>Cơ sở đang hoạt động</Text>
            </View>
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              style={styles.branchesIconBg}
            >
              <Ionicons name="business" size={28} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 32,
  },
  // Welcome Header
  welcomeGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  welcomeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  welcomeIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  statCard: {
    width: (width - 44) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardGradient: {
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  statTrend: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  // Menu Grid
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  menuCard: {
    width: (width - 44) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  // Finance Card
  financeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  financeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  financeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  financeInfo: {
    flex: 1,
  },
  financeLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  financeValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  // Classes
  classItem: {
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
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  classSubject: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: "#D1FAE5",
  },
  inactiveBadge: {
    backgroundColor: "#F3F4F6",
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  // Incidents Alert
  incidentAlert: {
    borderRadius: 16,
    overflow: "hidden",
  },
  incidentAlertGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  incidentAlertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  incidentAlertInfo: {
    flex: 1,
  },
  incidentAlertTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#B91C1C",
  },
  incidentAlertSubtitle: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 2,
  },
  // Branches Card
  branchesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  branchesInfo: {
    flex: 1,
  },
  branchesCount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#8B5CF6",
  },
  branchesLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  branchesIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
