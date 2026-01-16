import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useAuthStore,
  useNotificationsStore,
  useClassesStore,
  usePaymentRequestsStore,
  useIncidentsStore,
} from "@/lib/stores";
import { router } from "expo-router";

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

// Role-specific overview cards
const getOverviewCards = (
  role: string,
  data: {
    classCount: number;
    pendingPayments: number;
    pendingPaymentAmount: number;
    incidentsCount: number;
  }
) => {
  const baseCards = {
    student: [
      {
        label: "Khóa học",
        value: data.classCount.toString(),
        note: "Đang theo học",
        icon: "book" as const,
        colors: ["#3B82F6", "#2563EB"],
      },
      {
        label: "Thanh toán",
        value: data.pendingPayments > 0 ? data.pendingPayments.toString() : "0",
        note: data.pendingPayments > 0 ? "Chưa thanh toán" : "Đã hoàn thành",
        icon: "wallet" as const,
        colors:
          data.pendingPayments > 0
            ? ["#EF4444", "#DC2626"]
            : ["#10B981", "#059669"],
      },
      {
        label: "Điểm TB",
        value: "8.2",
        note: "Kết quả tốt",
        icon: "star" as const,
        colors: ["#F59E0B", "#D97706"],
      },
      {
        label: "Sự cố",
        value: data.incidentsCount.toString(),
        note: "Đang xử lý",
        icon: "warning" as const,
        colors: ["#8B5CF6", "#7C3AED"],
      },
    ],
    parent: [
      {
        label: "Khóa học con",
        value: data.classCount.toString(),
        note: "Đang theo học",
        icon: "book" as const,
        colors: ["#3B82F6", "#2563EB"],
      },
      {
        label: "Cần thanh toán",
        value: data.pendingPayments > 0 ? data.pendingPayments.toString() : "0",
        note: data.pendingPayments > 0 ? "Khoản chờ" : "Đã hoàn thành",
        icon: "wallet" as const,
        colors:
          data.pendingPayments > 0
            ? ["#EF4444", "#DC2626"]
            : ["#10B981", "#059669"],
      },
      {
        label: "Điểm TB",
        value: "8.2",
        note: "Kết quả tốt",
        icon: "star" as const,
        colors: ["#F59E0B", "#D97706"],
      },
      {
        label: "Xếp loại",
        value: "Tốt",
        note: "Đánh giá chung",
        icon: "trophy" as const,
        colors: ["#8B5CF6", "#7C3AED"],
      },
    ],
    teacher: [
      {
        label: "Lớp giảng dạy",
        value: data.classCount.toString(),
        note: "Đang dạy",
        icon: "book" as const,
        colors: ["#10B981", "#059669"],
      },
      {
        label: "Học sinh",
        value: "45",
        note: "Tổng số",
        icon: "people" as const,
        colors: ["#3B82F6", "#2563EB"],
      },
      {
        label: "Buổi dạy",
        value: "12",
        note: "Tháng này",
        icon: "calendar" as const,
        colors: ["#F59E0B", "#D97706"],
      },
      {
        label: "Đánh giá",
        value: "4.8",
        note: "Từ học sinh",
        icon: "star" as const,
        colors: ["#8B5CF6", "#7C3AED"],
      },
    ],
    admin: [
      {
        label: "Lớp học",
        value: data.classCount.toString(),
        note: "Đang hoạt động",
        icon: "school" as const,
        colors: ["#8B5CF6", "#7C3AED"],
      },
      {
        label: "Học sinh",
        value: "120",
        note: "Tổng số",
        icon: "people" as const,
        colors: ["#3B82F6", "#2563EB"],
      },
      {
        label: "Giáo viên",
        value: "15",
        note: "Đang dạy",
        icon: "person" as const,
        colors: ["#10B981", "#059669"],
      },
      {
        label: "Sự cố",
        value: data.incidentsCount.toString(),
        note: "Chờ xử lý",
        icon: "warning" as const,
        colors: ["#F59E0B", "#D97706"],
      },
    ],
  };

  return baseCards[role as keyof typeof baseCards] || baseCards.student;
};

// Role-specific quick actions
const getQuickActions = (
  role: string,
  unreadCount: number,
  pendingPayments: number
) => {
  const baseActions = {
    student: [
      {
        icon: "calendar" as const,
        label: "Lịch học",
        subtitle: "Xem lịch tuần",
        colors: ["#3B82F6", "#2563EB"],
        onPress: () => router.push("/(tabs)/schedule"),
      },
      {
        icon: "school" as const,
        label: "Lớp học",
        subtitle: "Quản lý lớp",
        colors: ["#10B981", "#059669"],
        onPress: () => router.push("/(tabs)/classes"),
      },
      {
        icon: "wallet" as const,
        label: "Thanh toán",
        subtitle:
          pendingPayments > 0
            ? `${pendingPayments} chờ thanh toán`
            : "Đã hoàn thành",
        colors:
          pendingPayments > 0 ? ["#EF4444", "#DC2626"] : ["#F59E0B", "#D97706"],
        badge: pendingPayments,
        onPress: () => router.push("/(tabs)/payments"),
      },
      {
        icon: "warning" as const,
        label: "Sự cố",
        subtitle: "Báo cáo vấn đề",
        colors: ["#8B5CF6", "#7C3AED"],
        onPress: () => router.push("/(tabs)/incidents"),
      },
    ],
    parent: [
      {
        icon: "calendar" as const,
        label: "Lịch học con",
        subtitle: "Xem lịch học",
        colors: ["#F59E0B", "#D97706"],
        onPress: () => router.push("/(tabs)/schedule"),
      },
      {
        icon: "school" as const,
        label: "Lớp học",
        subtitle: "Theo dõi lớp",
        colors: ["#10B981", "#059669"],
        onPress: () => router.push("/(tabs)/classes"),
      },
      {
        icon: "wallet" as const,
        label: "Thanh toán",
        subtitle:
          pendingPayments > 0
            ? `${pendingPayments} chờ thanh toán`
            : "Đã hoàn thành",
        colors:
          pendingPayments > 0 ? ["#EF4444", "#DC2626"] : ["#3B82F6", "#2563EB"],
        badge: pendingPayments,
        onPress: () => router.push("/(tabs)/payments"),
      },
      {
        icon: "warning" as const,
        label: "Sự cố",
        subtitle: "Phản ánh vấn đề",
        colors: ["#8B5CF6", "#7C3AED"],
        onPress: () => router.push("/(tabs)/incidents"),
      },
    ],
    teacher: [
      {
        icon: "calendar" as const,
        label: "Lịch dạy",
        subtitle: "Xem lịch tuần",
        colors: ["#10B981", "#059669"],
        onPress: () => router.push("/(tabs)/schedule"),
      },
      {
        icon: "school" as const,
        label: "Lớp học",
        subtitle: "Quản lý lớp",
        colors: ["#3B82F6", "#2563EB"],
        onPress: () => router.push("/(tabs)/classes"),
      },
      {
        icon: "notifications" as const,
        label: "Thông báo",
        subtitle: unreadCount > 0 ? `${unreadCount} chưa đọc` : "Cập nhật",
        colors: ["#F59E0B", "#D97706"],
        badge: unreadCount,
        onPress: () => router.push("/(tabs)/notifications"),
      },
      {
        icon: "warning" as const,
        label: "Sự cố",
        subtitle: "Báo cáo vấn đề",
        colors: ["#8B5CF6", "#7C3AED"],
        onPress: () => router.push("/(tabs)/incidents"),
      },
    ],
    admin: [
      {
        icon: "school" as const,
        label: "Lớp học",
        subtitle: "Quản lý lớp",
        colors: ["#8B5CF6", "#7C3AED"],
        onPress: () => router.push("/(tabs)/classes"),
      },
      {
        icon: "notifications" as const,
        label: "Thông báo",
        subtitle: unreadCount > 0 ? `${unreadCount} chưa đọc` : "Cập nhật",
        colors: ["#3B82F6", "#2563EB"],
        badge: unreadCount,
        onPress: () => router.push("/(tabs)/notifications"),
      },
      {
        icon: "person" as const,
        label: "Tài khoản",
        subtitle: "Cài đặt",
        colors: ["#10B981", "#059669"],
        onPress: () => router.push("/(tabs)/profile"),
      },
      {
        icon: "calendar" as const,
        label: "Lịch",
        subtitle: "Xem lịch",
        colors: ["#F59E0B", "#D97706"],
        onPress: () => router.push("/(tabs)/schedule"),
      },
    ],
  };

  return baseActions[role as keyof typeof baseActions] || baseActions.student;
};

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationsStore();
  const { classes, fetchClasses, isLoading } = useClassesStore();
  const {
    myRequests,
    childrenRequests,
    fetchMyRequests,
    fetchChildrenRequests,
  } = usePaymentRequestsStore();
  const { myIncidents, fetchMyIncidents } = useIncidentsStore();

  const role = user?.role || "student";

  useEffect(() => {
    loadData();
  }, [role]);

  const loadData = useCallback(async () => {
    await fetchNotifications();
    await fetchClasses();

    if (role === "student") {
      await fetchMyRequests();
      await fetchMyIncidents();
    } else if (role === "parent") {
      await fetchChildrenRequests();
      await fetchMyIncidents();
    } else if (role === "teacher") {
      await fetchMyIncidents();
    }
  }, [role]);

  const onRefresh = async () => {
    await loadData();
  };

  // Calculate pending payments
  const pendingPayments =
    role === "student"
      ? myRequests.filter(
          (r) => r.status === "pending" || r.status === "overdue"
        ).length
      : role === "parent"
      ? childrenRequests
          .flatMap((c) => c.requests)
          .filter((r) => r.status === "pending" || r.status === "overdue")
          .length
      : 0;

  const pendingPaymentAmount =
    role === "student"
      ? myRequests
          .filter((r) => r.status === "pending" || r.status === "overdue")
          .reduce((sum, r) => sum + r.finalAmount, 0)
      : role === "parent"
      ? childrenRequests
          .flatMap((c) => c.requests)
          .filter((r) => r.status === "pending" || r.status === "overdue")
          .reduce((sum, r) => sum + r.finalAmount, 0)
      : 0;

  const pendingIncidents = myIncidents.filter(
    (i) => i.status === "pending" || i.status === "in_progress"
  ).length;

  const roleConfig = getRoleConfig(role);
  const overviewCards = getOverviewCards(role, {
    classCount: classes.length,
    pendingPayments,
    pendingPaymentAmount,
    incidentsCount: pendingIncidents,
  });

  const quickActions = getQuickActions(role, unreadCount, pendingPayments);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section with Gradient */}
        <LinearGradient
          colors={roleConfig.colors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeGradient}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Ionicons
                  name="person"
                  size={32}
                  color={roleConfig.colors[0]}
                />
              </View>
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.welcomeText}>
              <Text style={styles.greeting}>Xin chào! 👋</Text>
              <Text style={styles.userName}>
                {user?.fullName || "Người dùng"}
              </Text>
              <View style={styles.roleBadge}>
                <Ionicons
                  name={roleConfig.icon as any}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.roleText}>{roleConfig.label}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Overview Stats Cards */}
        <View style={styles.overviewSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.overviewScroll}
          >
            {overviewCards.map((card, index) => (
              <View key={index} style={styles.overviewCard}>
                <LinearGradient
                  colors={card.colors as [string, string]}
                  style={styles.overviewIconBg}
                >
                  <Ionicons name={card.icon} size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.overviewValue}>{card.value}</Text>
                <Text style={styles.overviewLabel}>{card.label}</Text>
                <Text style={styles.overviewNote}>{card.note}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={action.colors as [string, string]}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name={action.icon} size={28} color="#FFFFFF" />
                  {action.badge && action.badge > 0 ? (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>
                        {action.badge > 9 ? "9+" : action.badge}
                      </Text>
                    </View>
                  ) : null}
                </LinearGradient>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionSubtitle}>
                  {action.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lớp học của tôi</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/classes")}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAll}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {classes.length === 0 ? (
            <View style={styles.emptyCard}>
              <LinearGradient
                colors={["#F3F4F6", "#E5E7EB"]}
                style={styles.emptyIconBg}
              >
                <Ionicons name="school-outline" size={40} color="#9CA3AF" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Chưa có lớp học nào</Text>
              <Text style={styles.emptyText}>
                Bạn sẽ thấy danh sách lớp học tại đây
              </Text>
            </View>
          ) : (
            classes.slice(0, 3).map((classItem, index) => (
              <TouchableOpacity
                key={classItem._id}
                style={styles.classCard}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    index % 2 === 0
                      ? ["#3B82F6", "#2563EB"]
                      : ["#10B981", "#059669"]
                  }
                  style={styles.classIconBg}
                >
                  <Ionicons name="book" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  <Text style={styles.classSubject}>{classItem.subject}</Text>
                </View>
                <View style={styles.classArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Payment Alert - for Student and Parent only */}
        {(role === "student" || role === "parent") && pendingPayments > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => router.push("/(tabs)/payments")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FEE2E2", "#FECACA"]}
                style={styles.alertGradient}
              >
                <View style={styles.alertContent}>
                  <View style={styles.alertIconBg}>
                    <Ionicons name="wallet" size={24} color="#DC2626" />
                  </View>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertTitle}>
                      Có khoản cần thanh toán
                    </Text>
                    <Text style={styles.alertSubtitle}>
                      {pendingPayments} khoản •{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(pendingPaymentAmount)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#DC2626" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Streak Card - Gamification Element (Student only) */}
        {role === "student" && (
          <View style={styles.section}>
            <View style={styles.streakCard}>
              <LinearGradient
                colors={["#FEF3C7", "#FDE68A"]}
                style={styles.streakGradient}
              >
                <View style={styles.streakContent}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <View style={styles.streakInfo}>
                    <Text style={styles.streakTitle}>Chuỗi điểm danh</Text>
                    <Text style={styles.streakValue}>12 ngày liên tục</Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={16} color="#D97706" />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Teacher Stats Card */}
        {role === "teacher" && (
          <View style={styles.section}>
            <View style={styles.teacherStatsCard}>
              <Text style={styles.teacherStatsTitle}>Thống kê tháng này</Text>
              <View style={styles.teacherStatsGrid}>
                <View style={styles.teacherStatItem}>
                  <LinearGradient
                    colors={["#10B981", "#059669"]}
                    style={styles.teacherStatIcon}
                  >
                    <Ionicons name="calendar" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.teacherStatValue}>12</Text>
                  <Text style={styles.teacherStatLabel}>Buổi đã dạy</Text>
                </View>
                <View style={styles.teacherStatItem}>
                  <LinearGradient
                    colors={["#3B82F6", "#2563EB"]}
                    style={styles.teacherStatIcon}
                  >
                    <Ionicons name="people" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.teacherStatValue}>95%</Text>
                  <Text style={styles.teacherStatLabel}>Tỉ lệ đi học</Text>
                </View>
                <View style={styles.teacherStatItem}>
                  <LinearGradient
                    colors={["#F59E0B", "#D97706"]}
                    style={styles.teacherStatIcon}
                  >
                    <Ionicons name="star" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.teacherStatValue}>4.8</Text>
                  <Text style={styles.teacherStatLabel}>Đánh giá</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Parent Child Progress */}
        {role === "parent" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tiến độ học tập</Text>
            </View>
            <View style={styles.progressCard}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Điểm trung bình</Text>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={["#10B981", "#059669"]}
                    style={[styles.progressFill, { width: "82%" }]}
                  />
                </View>
                <Text style={styles.progressValue}>8.2/10</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Chuyên cần</Text>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={["#3B82F6", "#2563EB"]}
                    style={[styles.progressFill, { width: "95%" }]}
                  />
                </View>
                <Text style={styles.progressValue}>95%</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Bài tập</Text>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={["#F59E0B", "#D97706"]}
                    style={[styles.progressFill, { width: "88%" }]}
                  />
                </View>
                <Text style={styles.progressValue}>88%</Text>
              </View>
            </View>
          </View>
        )}
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
  welcomeGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  overviewSection: {
    marginTop: -12,
    marginBottom: 8,
  },
  overviewScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: (width - 56) / 2.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  overviewIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  overviewNote: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAll: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  quickActionCard: {
    width: (width - 56) / 2,
    paddingHorizontal: 6,
    marginBottom: 12,
    alignItems: "center",
  },
  quickActionGradient: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },
  classCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  classIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 3,
  },
  classSubject: {
    fontSize: 14,
    color: "#6B7280",
  },
  classArrow: {
    padding: 4,
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
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  streakCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  streakGradient: {
    padding: 16,
  },
  streakContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 2,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#78350F",
  },
  streakBadge: {
    backgroundColor: "rgba(217, 119, 6, 0.2)",
    padding: 10,
    borderRadius: 12,
  },
  // Alert Card
  alertCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  alertGradient: {
    padding: 16,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#B91C1C",
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 13,
    color: "#DC2626",
  },
  // Teacher Stats
  teacherStatsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teacherStatsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  teacherStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  teacherStatItem: {
    alignItems: "center",
    flex: 1,
  },
  teacherStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  teacherStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  teacherStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  // Parent Progress
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "right",
  },
});
