import { useEffect, useState, useCallback, useMemo } from "react";
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
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useAuthStore,
  useClassesStore,
  useIncidentsStore,
  useBranchesStore,
  getUserDisplayName,
  useFinanceStore,
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
  {
    id: "finance",
    icon: "wallet" as const,
    label: "Tài chính",
    subtitle: "Quản lý thu chi",
    colors: ["#10B981", "#059669"],
    onPress: () => router.push("/(tabs)/admin/finance"),
  },
  {
    id: "leaderboard",
    icon: "trophy" as const,
    label: "Bảng xếp hạng",
    subtitle: "Học sinh xuất sắc",
    colors: ["#F59E0B", "#D97706"],
    onPress: () => router.push("/(tabs)/admin/leaderboard"),
  },
];

// Format currency helper
const formatFinanceCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} Tr`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toLocaleString("vi-VN");
};

// Subject colors for pie chart
const subjectColors = [
  "#3B82F6", // Toán
  "#10B981", // Lý
  "#F59E0B", // Hóa
  "#EF4444", // Văn
  "#8B5CF6", // Anh
  "#EC4899", // Sinh
];

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
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
  const {
    dashboard: financeDashboard,
    isLoading: financeStoreLoading,
    fetchDashboard: fetchFinanceDashboard,
    createExpense,
    fetchExpenses: fetchFinanceExpenses,
  } = useFinanceStore();

  // Finance section state
  const [selectedFinanceBranch, setSelectedFinanceBranch] = useState<string>("ALL");
  const [selectedFinanceYear, setSelectedFinanceYear] = useState<number>(new Date().getFullYear());
  const [showFinanceBranchPicker, setShowFinanceBranchPicker] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState("");

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

  // Fetch finance data when branch/year changes
  useEffect(() => {
    fetchFinanceDashboard(selectedFinanceBranch, selectedFinanceYear);
  }, [selectedFinanceBranch, selectedFinanceYear]);

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
      // Fetch user counts by role - BE returns full array, so we count length
      const [studentsRes, teachersRes, parentsRes] = await Promise.all([
        api.get("/users?role=student"),
        api.get("/users?role=teacher"),
        api.get("/users?role=parent"),
      ]);

      // API returns array directly
      const studentsCount = Array.isArray(studentsRes.data) ? studentsRes.data.length : 0;
      const teachersCount = Array.isArray(teachersRes.data) ? teachersRes.data.length : 0;
      const parentsCount = Array.isArray(parentsRes.data) ? parentsRes.data.length : 0;

      setStats({
        students: studentsCount,
        teachers: teachersCount,
        parents: parentsCount,
        totalUsers: studentsCount + teachersCount + parentsCount,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const onRefresh = async () => {
    await loadData();
    fetchFinanceDashboard(selectedFinanceBranch, selectedFinanceYear);
  };

  // Expense handlers
  const handleAddExpense = async () => {
    setExpenseError("");
    const numAmount = Number(expenseAmount.replace(/[.,]/g, ""));
    if (!numAmount || numAmount <= 0) {
      setExpenseError("Số tiền phải lớn hơn 0");
      return;
    }
    if (!expenseDesc.trim()) {
      setExpenseError("Vui lòng nhập nội dung chi phí");
      return;
    }
    setExpenseSubmitting(true);
    try {
      await createExpense({
        branchId: selectedFinanceBranch,
        amount: numAmount,
        description: expenseDesc.trim(),
        expenseDate: expenseDate,
      });
      await fetchFinanceDashboard(selectedFinanceBranch, selectedFinanceYear);
      setExpenseAmount("");
      setExpenseDesc("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setShowExpenseModal(false);
      Alert.alert("Thành công", "Đã thêm chi phí thành công");
    } catch (err: any) {
      setExpenseError(err.message || "Có lỗi xảy ra");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const selectedFinanceBranchName = selectedFinanceBranch === "ALL"
    ? "Tất cả cơ sở"
    : branches.find((b) => b._id === selectedFinanceBranch)?.name || "Chọn cơ sở";

  // Calculate dynamic stats
  const pendingIncidents = incidents.filter(
    (i) => i.status === "pending" || i.status === "in_progress",
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
        pendingIncidents > 0 ? ["#EF4444", "#DC2626"] : ["#10B981", "#059669"],
    },
  ];

  // Calculate student distribution by subject
  const studentsBySubject = useMemo(() => {
    const subjectMap: Record<string, number> = {};
    classes.forEach((cls) => {
      const subject = cls.subject || "Khác";
      const studentCount = cls.studentIds?.length || 0;
      subjectMap[subject] = (subjectMap[subject] || 0) + studentCount;
    });

    const data = Object.entries(subjectMap).map(([subject, count], index) => ({
      subject,
      count,
      color: subjectColors[index % subjectColors.length],
    }));

    // Sort by count descending
    return data.sort((a, b) => b.count - a.count);
  }, [classes]);

  const totalStudentsInClasses = useMemo(() => {
    return studentsBySubject.reduce((sum, item) => sum + item.count, 0);
  }, [studentsBySubject]);

  // Finance chart data from store
  const financeRevenueByMonth = financeDashboard?.chart?.revenueByMonth || [];
  const financeExpenseByMonth = financeDashboard?.chart?.expenseByMonth || [];
  const financeChartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const rev = financeRevenueByMonth.find((r) => r.month === month)?.amount || 0;
    const exp = financeExpenseByMonth.find((e) => e.month === month)?.amount || 0;
    return { month, revenue: rev, expense: exp };
  }).filter((d) => d.revenue > 0 || d.expense > 0);
  const maxFinanceChartValue = Math.max(...financeChartData.map((d) => Math.max(d.revenue, d.expense)), 1);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || classesLoading || incidentsLoading}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overscroll Filler */}
        <View
          style={{
            position: "absolute",
            top: -1000,
            left: 0,
            right: 0,
            height: 1000,
            backgroundColor: "#8B5CF6", // Matches header top color
          }}
        />

        {/* Welcome Header */}
        <LinearGradient
          colors={["#8B5CF6", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.welcomeGradient, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeGreeting}>Xin chào Admin 👋</Text>
              <Text style={styles.welcomeName}>{getUserDisplayName(user)}</Text>
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

        {/* Revenue/Expense Chart - Real Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Thu/Chi theo tháng</Text>
          <View style={styles.chartCard}>
            {financeChartData.length > 0 ? (
              <>
                <View style={styles.barChartContainer}>
                  {financeChartData.map((item, index) => (
                    <View key={index} style={styles.barWrapper}>
                      <View style={{ flexDirection: "row", gap: 2, height: 120, alignItems: "flex-end" }}>
                        <View style={[styles.barBackground, { width: 14 }]}>
                          <LinearGradient
                            colors={["#10B981", "#059669"]}
                            style={[
                              styles.bar,
                              { height: `${(item.revenue / maxFinanceChartValue) * 100}%` },
                            ]}
                          />
                        </View>
                        <View style={[styles.barBackground, { width: 14 }]}>
                          <LinearGradient
                            colors={["#EF4444", "#DC2626"]}
                            style={[
                              styles.bar,
                              { height: `${(item.expense / maxFinanceChartValue) * 100}%` },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.barLabel}>T{item.month}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chartLegend}>
                  <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                  <Text style={[styles.legendText, { marginRight: 16 }]}>Doanh thu</Text>
                  <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.legendText}>Chi phí</Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyChartContainer}>
                <Ionicons name="bar-chart-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyChartText}>Chưa có dữ liệu</Text>
              </View>
            )}
          </View>
        </View>

        {/* Student Distribution Pie Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎓 Phân bổ học sinh theo môn</Text>
          <View style={styles.chartCard}>
            {studentsBySubject.length === 0 ? (
              <View style={styles.emptyChartContainer}>
                <Ionicons name="pie-chart-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyChartText}>Chưa có dữ liệu</Text>
              </View>
            ) : (
              <>
                {/* Simple horizontal bar chart as alternative to pie */}
                <View style={styles.horizontalBarChart}>
                  {studentsBySubject.slice(0, 5).map((item, index) => (
                    <View key={index} style={styles.horizontalBarRow}>
                      <View style={styles.horizontalBarLabelContainer}>
                        <View
                          style={[
                            styles.subjectDot,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <Text style={styles.horizontalBarLabel}>
                          {item.subject}
                        </Text>
                      </View>
                      <View style={styles.horizontalBarTrack}>
                        <View
                          style={[
                            styles.horizontalBarFill,
                            {
                              width:
                                totalStudentsInClasses > 0
                                  ? `${(item.count / totalStudentsInClasses) * 100}%`
                                  : "0%",
                              backgroundColor: item.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.horizontalBarValue}>
                        {item.count}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chartSummary}>
                  <Text style={styles.chartSummaryText}>
                    Tổng: {totalStudentsInClasses} học sinh trong{" "}
                    {classes.length} lớp
                  </Text>
                </View>
              </>
            )}
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

        {/* Finance Summary - Real Data with Branch Filter & Expense Button */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💰 Tài chính</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/admin/finance")}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Xem chi tiết</Text>
              <Ionicons name="chevron-forward" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* Branch Picker */}
          <TouchableOpacity
            style={styles.financeBranchPicker}
            onPress={() => setShowFinanceBranchPicker(true)}
          >
            <Ionicons name="business" size={16} color="#10B981" />
            <Text style={styles.financeBranchText} numberOfLines={1}>{selectedFinanceBranchName}</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* Branch Picker Modal */}
          <Modal visible={showFinanceBranchPicker} transparent animationType="fade" onRequestClose={() => setShowFinanceBranchPicker(false)}>
            <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowFinanceBranchPicker(false)}>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerTitle}>Chọn cơ sở</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  <TouchableOpacity
                    style={[styles.pickerOption, selectedFinanceBranch === "ALL" && styles.pickerOptionActive]}
                    onPress={() => { setSelectedFinanceBranch("ALL"); setShowFinanceBranchPicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, selectedFinanceBranch === "ALL" && styles.pickerOptionTextActive]}>
                      🏢 Tất cả cơ sở
                    </Text>
                    {selectedFinanceBranch === "ALL" && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                  </TouchableOpacity>
                  {branches.map((branch) => (
                    <TouchableOpacity
                      key={branch._id}
                      style={[styles.pickerOption, selectedFinanceBranch === branch._id && styles.pickerOptionActive]}
                      onPress={() => { setSelectedFinanceBranch(branch._id); setShowFinanceBranchPicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, selectedFinanceBranch === branch._id && styles.pickerOptionTextActive]}>
                        📍 {branch.name}
                      </Text>
                      {selectedFinanceBranch === branch._id && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Finance Stats Cards */}
          <View style={styles.financeCard}>
            {financeStoreLoading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 8 }}>Đang tải...</Text>
              </View>
            ) : financeDashboard ? (
              <>
                {/* Total Revenue */}
                <View style={styles.financeItem}>
                  <View style={[styles.financeIconBg, { backgroundColor: "#10B98120" }]}>
                    <Ionicons name="trending-up" size={20} color="#10B981" />
                  </View>
                  <View style={styles.financeInfo}>
                    <Text style={styles.financeLabel}>Tổng doanh thu</Text>
                    <Text style={[styles.financeValue, { color: "#10B981" }]}>
                      {formatFinanceCurrency(financeDashboard.summary.totalRevenue)}
                    </Text>
                  </View>
                </View>

                {/* Total Expense + Add Button */}
                <View style={styles.financeItem}>
                  <View style={[styles.financeIconBg, { backgroundColor: "#EF444420" }]}>
                    <Ionicons name="trending-down" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.financeInfo}>
                    <Text style={styles.financeLabel}>Chi phí</Text>
                    <Text style={[styles.financeValue, { color: "#EF4444" }]}>
                      {formatFinanceCurrency(financeDashboard.summary.totalExpense)}
                    </Text>
                  </View>
                  {selectedFinanceBranch !== "ALL" && (
                    <TouchableOpacity
                      style={styles.addExpenseBtn}
                      onPress={() => setShowExpenseModal(true)}
                    >
                      <Ionicons name="add-circle" size={16} color="#DC2626" />
                      <Text style={styles.addExpenseBtnText}>Thêm chi</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Profit */}
                <View style={[styles.financeItem, { borderBottomWidth: 0 }]}>
                  <View style={[styles.financeIconBg, { backgroundColor: financeDashboard.summary.profit >= 0 ? "#3B82F620" : "#F9731620" }]}>
                    <Ionicons name="diamond" size={20} color={financeDashboard.summary.profit >= 0 ? "#3B82F6" : "#F97316"} />
                  </View>
                  <View style={styles.financeInfo}>
                    <Text style={styles.financeLabel}>Lợi nhuận</Text>
                    <Text style={[styles.financeValue, { color: financeDashboard.summary.profit >= 0 ? "#3B82F6" : "#F97316" }]}>
                      {formatFinanceCurrency(financeDashboard.summary.profit)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💰</Text>
                <Text style={{ fontSize: 13, color: "#6B7280" }}>Chưa có dữ liệu tài chính</Text>
              </View>
            )}
          </View>
        </View>

        {/* Expense Modal */}
        <Modal visible={showExpenseModal} transparent animationType="fade" onRequestClose={() => setShowExpenseModal(false)}>
          <View style={styles.expenseOverlay}>
            <View style={styles.expenseContainer}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseHeaderTitle}>💸 Thêm chi phí</Text>
                <TouchableOpacity onPress={() => { setShowExpenseModal(false); setExpenseError(""); }}>
                  <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.expenseField}>
                <Text style={styles.expenseLabel}>Số tiền (VNĐ) *</Text>
                <TextInput
                  style={styles.expenseInput}
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  placeholder="Nhập số tiền..."
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.expenseField}>
                <Text style={styles.expenseLabel}>Nội dung *</Text>
                <TextInput
                  style={[styles.expenseInput, { height: 80, textAlignVertical: "top" }]}
                  value={expenseDesc}
                  onChangeText={setExpenseDesc}
                  placeholder="Nhập nội dung chi phí..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.expenseField}>
                <Text style={styles.expenseLabel}>Ngày chi</Text>
                <TextInput
                  style={styles.expenseInput}
                  value={expenseDate}
                  onChangeText={setExpenseDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {expenseError ? (
                <View style={styles.expenseErrorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.expenseErrorText}>{expenseError}</Text>
                </View>
              ) : null}

              <View style={styles.expenseActions}>
                <TouchableOpacity
                  style={styles.expenseCancelBtn}
                  onPress={() => { setShowExpenseModal(false); setExpenseError(""); }}
                >
                  <Text style={styles.expenseCancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.expenseSubmitBtn, expenseSubmitting && { opacity: 0.6 }]}
                  onPress={handleAddExpense}
                  disabled={expenseSubmitting}
                >
                  {expenseSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.expenseSubmitBtnText}>Thêm chi phí</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Recent Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Lớp học gần đây</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/classes")}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={16} color="#10B981" />
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
                      ? ["#3B82F6", "#3B82F6"]
                      : index % 3 === 1
                        ? ["#10B981", "#10B981"]
                        : ["#F59E0B", "#F59E0B"]
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
                <Ionicons name="chevron-forward" size={16} color="#10B981" />
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
              <Ionicons name="chevron-forward" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>

          <View style={styles.branchesCard}>
            <View style={styles.branchesInfo}>
              <Text style={styles.branchesCount}>{branches.length}</Text>
              <Text style={styles.branchesLabel}>Cơ sở đang hoạt động</Text>
            </View>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.branchesIconBg}
            >
              <Ionicons name="business" size={28} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </View>
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
    color: "#10B981",
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
    padding: 12,
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
  // Charts
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    paddingHorizontal: 8,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
  },
  barValue: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "600",
  },
  barBackground: {
    width: 32,
    height: 120,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    fontWeight: "500",
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  horizontalBarChart: {
    paddingVertical: 8,
  },
  horizontalBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  horizontalBarLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
  },
  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  horizontalBarLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  horizontalBarTrack: {
    flex: 1,
    height: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  horizontalBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  horizontalBarValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    width: 30,
    textAlign: "right",
  },
  chartSummary: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
  },
  chartSummaryText: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyChartContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyChartText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  // Menu Grid
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  menuCard: {
    width: (width - 62) / 3,
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
    color: "#10B981",
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
  // Finance Branch Picker
  financeBranchPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  financeBranchText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 340,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerOptionActive: {
    backgroundColor: "#D1FAE5",
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  pickerOptionTextActive: {
    color: "#059669",
    fontWeight: "700",
  },
  // Add Expense Button
  addExpenseBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addExpenseBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  // Expense Modal
  expenseOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  expenseContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  expenseHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  expenseField: {
    marginBottom: 16,
  },
  expenseLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  expenseInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  expenseErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  expenseErrorText: {
    fontSize: 13,
    color: "#DC2626",
    flex: 1,
  },
  expenseActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  expenseCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  expenseCancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  expenseSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  expenseSubmitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
