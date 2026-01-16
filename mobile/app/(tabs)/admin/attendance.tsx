import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useClassesStore, useAttendanceStore } from "@/lib/stores";
import {
  useSessionsStore,
  Session as StoreSession,
} from "@/lib/stores/sessions-store";
import { AttendanceRecord as StoreAttendanceRecord } from "@/lib/stores/attendance-store";

const attendanceStatusConfig = {
  present: {
    label: "Có mặt",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "checkmark-circle",
  },
  absent: {
    label: "Vắng",
    color: "#EF4444",
    bg: "#FEE2E2",
    icon: "close-circle",
  },
  late: { label: "Đi muộn", color: "#F59E0B", bg: "#FEF3C7", icon: "time" },
  excused: {
    label: "Có phép",
    color: "#3B82F6",
    bg: "#DBEAFE",
    icon: "document-text",
  },
};

export default function AdminAttendanceScreen() {
  const { classes, fetchClasses } = useClassesStore();
  const {
    sessions,
    fetchSessions,
    isLoading: sessionsLoading,
  } = useSessionsStore();
  const { fetchSessionAttendance } = useAttendanceStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<StoreSession | null>(
    null
  );
  const [sessionAttendance, setSessionAttendance] = useState<
    StoreAttendanceRecord[]
  >([]);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalAttendance: 0,
    presentRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchClasses(), fetchSessions()]);
    calculateStats();
  };

  const calculateStats = () => {
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;
    setStats({
      totalSessions: sessions.length,
      completedSessions,
      totalAttendance: 0, // Would need API to get total
      presentRate: 0,
    });
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const filteredSessions = selectedClass
    ? sessions.filter((s) => s.classId?._id === selectedClass)
    : sessions;

  const handleViewAttendance = async (session: StoreSession) => {
    setSelectedSession(session);
    setIsDetailVisible(true);
    setIsLoadingAttendance(true);

    try {
      const attendance = await fetchSessionAttendance(session._id);
      setSessionAttendance(attendance || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setSessionAttendance([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  // Helper to get student name
  const getStudentName = (record: StoreAttendanceRecord): string => {
    if (typeof record.studentId === "object" && record.studentId?.fullName) {
      return record.studentId.fullName;
    }
    return "Học sinh";
  };

  // Helper to get class name from session
  const getClassName = (session: StoreSession): string => {
    if (typeof session.classId === "object" && session.classId?.name) {
      return session.classId.name;
    }
    return "Không có lớp";
  };

  // Helper to get teacher name from session
  const getTeacherName = (session: StoreSession): string | null => {
    if (typeof session.teacherId === "object" && session.teacherId?.fullName) {
      return session.teacherId.fullName;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderSessionCard = ({ item: session }: { item: StoreSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => handleViewAttendance(session)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionHeader}>
        <LinearGradient
          colors={
            session.status === "completed"
              ? ["#10B981", "#059669"]
              : session.status === "cancelled"
              ? ["#EF4444", "#DC2626"]
              : ["#3B82F6", "#2563EB"]
          }
          style={styles.sessionIcon}
        >
          <Ionicons name="calendar" size={20} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionClass}>{getClassName(session)}</Text>
          <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
          <Text style={styles.sessionTime}>
            {session.startTime} - {session.endTime}
          </Text>
        </View>

        <View style={styles.sessionRight}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  session.status === "completed"
                    ? "#D1FAE5"
                    : session.status === "cancelled"
                    ? "#FEE2E2"
                    : "#DBEAFE",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    session.status === "completed"
                      ? "#059669"
                      : session.status === "cancelled"
                      ? "#DC2626"
                      : "#2563EB",
                },
              ]}
            >
              {session.status === "completed"
                ? "Đã học"
                : session.status === "cancelled"
                ? "Đã hủy"
                : "Chờ học"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </View>
      </View>

      {getTeacherName(session) && (
        <View style={styles.sessionFooter}>
          <Ionicons name="person-outline" size={14} color="#6B7280" />
          <Text style={styles.teacherText}>GV: {getTeacherName(session)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAttendanceItem = ({
    item: record,
  }: {
    item: StoreAttendanceRecord;
  }) => {
    const status =
      attendanceStatusConfig[
        record.status as keyof typeof attendanceStatusConfig
      ] || attendanceStatusConfig.absent;

    return (
      <View style={styles.attendanceItem}>
        <View style={styles.attendanceLeft}>
          <View style={[styles.attendanceAvatar]}>
            <Text style={styles.attendanceAvatarText}>
              {getStudentName(record).charAt(0) || "?"}
            </Text>
          </View>
          <Text style={styles.attendanceName}>{getStudentName(record)}</Text>
        </View>
        <View style={[styles.attendanceBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon as any} size={14} color={status.color} />
          <Text style={[styles.attendanceBadgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Header */}
      <LinearGradient colors={["#14B8A6", "#0D9488"]} style={styles.header}>
        <Text style={styles.headerTitle}>📋 Quản lý điểm danh</Text>
        <Text style={styles.headerSubtitle}>
          Theo dõi điểm danh các buổi học
        </Text>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#6366F1" }]}>
            {stats.totalSessions}
          </Text>
          <Text style={styles.statLabel}>Tổng buổi học</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#10B981" }]}>
            {stats.completedSessions}
          </Text>
          <Text style={styles.statLabel}>Đã hoàn thành</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>
            {classes.length}
          </Text>
          <Text style={styles.statLabel}>Số lớp</Text>
        </View>
      </View>

      {/* Class Filter */}
      <Text style={styles.filterTitle}>Lọc theo lớp</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.classesScrollView}
        contentContainerStyle={styles.classesContainer}
      >
        <TouchableOpacity
          style={[styles.classChip, !selectedClass && styles.classChipActive]}
          onPress={() => setSelectedClass(null)}
        >
          <Text
            style={[
              styles.classChipText,
              !selectedClass && styles.classChipTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls._id}
            style={[
              styles.classChip,
              selectedClass === cls._id && styles.classChipActive,
            ]}
            onPress={() => setSelectedClass(cls._id)}
          >
            <Text
              style={[
                styles.classChipText,
                selectedClass === cls._id && styles.classChipTextActive,
              ]}
            >
              {cls.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sessions List */}
      {sessionsLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSessionCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không có buổi học nào</Text>
            </View>
          )}
        />
      )}

      {/* Attendance Detail Modal */}
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
            <Text style={styles.modalTitle}>Điểm danh buổi học</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedSession && (
            <ScrollView style={styles.modalContent}>
              {/* Session Info */}
              <View style={styles.sessionInfoCard}>
                <Text style={styles.sessionInfoClass}>
                  {getClassName(selectedSession)}
                </Text>
                <Text style={styles.sessionInfoDate}>
                  {formatDate(selectedSession.date)}
                </Text>
                <Text style={styles.sessionInfoTime}>
                  🕐 {selectedSession.startTime} - {selectedSession.endTime}
                </Text>
                {getTeacherName(selectedSession) && (
                  <Text style={styles.sessionInfoTeacher}>
                    👤 GV: {getTeacherName(selectedSession)}
                  </Text>
                )}
              </View>

              {/* Attendance Stats */}
              <View style={styles.attendanceStats}>
                <View style={styles.attendanceStatItem}>
                  <Text
                    style={[styles.attendanceStatValue, { color: "#10B981" }]}
                  >
                    {
                      sessionAttendance.filter((a) => a.status === "present")
                        .length
                    }
                  </Text>
                  <Text style={styles.attendanceStatLabel}>Có mặt</Text>
                </View>
                <View style={styles.attendanceStatItem}>
                  <Text
                    style={[styles.attendanceStatValue, { color: "#EF4444" }]}
                  >
                    {
                      sessionAttendance.filter((a) => a.status === "absent")
                        .length
                    }
                  </Text>
                  <Text style={styles.attendanceStatLabel}>Vắng</Text>
                </View>
                <View style={styles.attendanceStatItem}>
                  <Text
                    style={[styles.attendanceStatValue, { color: "#F59E0B" }]}
                  >
                    {
                      sessionAttendance.filter((a) => a.status === "late")
                        .length
                    }
                  </Text>
                  <Text style={styles.attendanceStatLabel}>Đi muộn</Text>
                </View>
                <View style={styles.attendanceStatItem}>
                  <Text
                    style={[styles.attendanceStatValue, { color: "#3B82F6" }]}
                  >
                    {
                      sessionAttendance.filter((a) => a.status === "excused")
                        .length
                    }
                  </Text>
                  <Text style={styles.attendanceStatLabel}>Có phép</Text>
                </View>
              </View>

              {/* Attendance List */}
              <Text style={styles.attendanceListTitle}>Danh sách học sinh</Text>
              {isLoadingAttendance ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#14B8A6" />
                </View>
              ) : sessionAttendance.length === 0 ? (
                <View style={styles.emptyAttendance}>
                  <Ionicons name="people-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyAttendanceText}>
                    Chưa có dữ liệu điểm danh
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={sessionAttendance}
                  renderItem={renderAttendanceItem}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                />
              )}
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  // Filter
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  classesScrollView: {
    marginBottom: 12,
  },
  classesContainer: {
    paddingHorizontal: 16,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  classChipActive: {
    backgroundColor: "#14B8A6",
  },
  classChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  classChipTextActive: {
    color: "#FFFFFF",
  },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionClass: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  sessionDate: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  sessionRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sessionFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 4,
  },
  teacherText: {
    fontSize: 12,
    color: "#6B7280",
  },
  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  sessionInfoCard: {
    backgroundColor: "#F0FDFA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#14B8A6",
  },
  sessionInfoClass: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0D9488",
    marginBottom: 8,
  },
  sessionInfoDate: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  sessionInfoTime: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  sessionInfoTeacher: {
    fontSize: 13,
    color: "#6B7280",
  },
  // Attendance Stats
  attendanceStats: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  attendanceStatItem: {
    flex: 1,
    alignItems: "center",
  },
  attendanceStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  attendanceStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  // Attendance List
  attendanceListTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  attendanceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  attendanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  attendanceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  attendanceAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },
  attendanceName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  attendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  attendanceBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyAttendance: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyAttendanceText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 8,
  },
});
