import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useScheduleStore, useAuthStore, useClassesStore } from "@/lib/stores";

const { width } = Dimensions.get("window");

const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const fullDaysOfWeek = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

// Helper function to get week date range
function getWeekRange(date: Date) {
  const dayOfWeek = date.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { startDate: monday.toISOString(), endDate: sunday.toISOString() };
}

// Status colors matching web
const getStatusConfig = (status?: string) => {
  switch (status) {
    case "present":
      return {
        colors: ["#10B981", "#059669"],
        icon: "checkmark-circle",
        label: "Có mặt",
      };
    case "absent":
      return {
        colors: ["#EF4444", "#DC2626"],
        icon: "close-circle",
        label: "Vắng",
      };
    case "late":
      return { colors: ["#F59E0B", "#D97706"], icon: "time", label: "Đi trễ" };
    case "excused":
      return {
        colors: ["#8B5CF6", "#7C3AED"],
        icon: "document-text",
        label: "Có phép",
      };
    case "approved":
      return {
        colors: ["#10B981", "#059669"],
        icon: "checkmark-circle",
        label: "Đã xác nhận",
      };
    case "pending":
      return {
        colors: ["#F59E0B", "#D97706"],
        icon: "time",
        label: "Chờ duyệt",
      };
    case "cancelled":
      return {
        colors: ["#EF4444", "#DC2626"],
        icon: "close-circle",
        label: "Đã hủy",
      };
    default:
      return {
        colors: ["#3B82F6", "#2563EB"],
        icon: "calendar",
        label: "Sắp tới",
      };
  }
};

// Timetable item interface
interface TimetableItem {
  classId: string;
  className: string;
  subject: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export default function ScheduleScreen() {
  const {
    sessions,
    isLoading: sessionsLoading,
    fetchTeacherSchedule,
    fetchStudentSchedule,
  } = useScheduleStore();
  const {
    classes,
    isLoading: classesLoading,
    fetchClasses,
  } = useClassesStore();
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  const isLoading = sessionsLoading || classesLoading;

  // Calculate current week based on offset
  const currentWeekStart = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [weekOffset]);

  useEffect(() => {
    loadSchedule();
  }, [user, weekOffset]);

  const loadSchedule = async () => {
    if (!user) return;

    if (user.role === "teacher") {
      // Fetch classes for teacher to build timetable
      await fetchClasses();
    } else if (user.role === "student") {
      const { startDate, endDate } = getWeekRange(currentWeekStart);
      await fetchStudentSchedule(user._id, startDate, endDate);
    }
  };

  const onRefresh = async () => {
    await loadSchedule();
  };

  // Generate dates for the week
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatDate = (date: Date) => {
    return date.getDate().toString();
  };

  // Build timetable for teacher from class schedules
  const teacherTimetable = useMemo((): TimetableItem[] => {
    if (user?.role !== "teacher") return [];

    const dayIndex = selectedDate.getDay();
    const timetable: TimetableItem[] = [];

    // Filter classes taught by this teacher
    const teacherClasses = classes.filter((cls) => {
      const teacherId =
        typeof cls.teacherId === "string" ? cls.teacherId : cls.teacherId;
      return teacherId === user._id;
    });

    teacherClasses.forEach((cls) => {
      if (cls.schedule && cls.schedule.length > 0) {
        cls.schedule.forEach((sch) => {
          if (sch.dayOfWeek === dayIndex) {
            timetable.push({
              classId: cls._id,
              className: cls.name,
              subject: cls.subject || "Chưa xác định",
              startTime: sch.startTime,
              endTime: sch.endTime,
              room: undefined,
            });
          }
        });
      }
    });

    // Sort by start time
    timetable.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return timetable;
  }, [classes, selectedDate, user]);

  // Filter sessions by selected date (for students)
  const filteredSessions = useMemo(() => {
    if (user?.role === "teacher") return [];

    return sessions.filter((session) => {
      const sessionDate = new Date(session.startTime);
      return (
        sessionDate.getDate() === selectedDate.getDate() &&
        sessionDate.getMonth() === selectedDate.getMonth() &&
        sessionDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [sessions, selectedDate, user]);

  // Get class name from session
  const getClassName = (session: any) => {
    if (typeof session.classId === "object" && session.classId?.name) {
      return session.classId.name;
    }
    return "Chưa xác định";
  };

  // Get subject from session
  const getSubject = (session: any) => {
    if (typeof session.classId === "object" && session.classId?.subject) {
      return session.classId.subject;
    }
    return session.subject || "";
  };

  // Format time from session
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    setWeekOffset(weekOffset - 1);
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    setWeekOffset(weekOffset + 1);
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Week Calendar Header */}
      <View style={styles.calendarContainer}>
        <View style={styles.weekHeader}>
          <TouchableOpacity
            style={styles.weekNavButton}
            onPress={goToPreviousWeek}
          >
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.weekTitle}>
            Tháng {currentWeekStart.getMonth() + 1},{" "}
            {currentWeekStart.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.weekNavButton} onPress={goToNextWeek}>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.weekRow}>
          {weekDates.map((date, index) => {
            const selected = isSelected(date);
            const today = isToday(date);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCell, selected && styles.selectedDateCell]}
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.selectedDayText,
                    today && !selected && styles.todayDayText,
                  ]}
                >
                  {daysOfWeek[(index + 1) % 7]}
                </Text>
                <View
                  style={[
                    styles.dateCircle,
                    selected && styles.selectedDateCircle,
                    today && !selected && styles.todayDateCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      selected && styles.selectedDateText,
                      today && !selected && styles.todayDateText,
                    ]}
                  >
                    {formatDate(date)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Date Header */}
      <View style={styles.selectedDateHeader}>
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateTitle}>
            {fullDaysOfWeek[selectedDate.getDay()]}
          </Text>
          <Text style={styles.selectedDateSubtitle}>
            {selectedDate.toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.sessionCount}>
          <Text style={styles.sessionCountText}>
            {user?.role === "teacher"
              ? teacherTimetable.length
              : filteredSessions.length}{" "}
            buổi {user?.role === "teacher" ? "dạy" : "học"}
          </Text>
        </View>
      </View>

      {/* Schedule List */}
      <ScrollView
        style={styles.scheduleList}
        contentContainerStyle={styles.scheduleContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Teacher Timetable View */}
        {user?.role === "teacher" ? (
          teacherTimetable.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={["#F3F4F6", "#E5E7EB"]}
                style={styles.emptyIconBg}
              >
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Không có lịch dạy</Text>
              <Text style={styles.emptyText}>
                Bạn không có tiết dạy nào trong ngày này
              </Text>
            </View>
          ) : (
            teacherTimetable.map((item, index) => (
              <View
                key={`${item.classId}-${index}`}
                style={styles.scheduleCard}
              >
                <View style={styles.timeColumn}>
                  <LinearGradient
                    colors={["#3B82F6", "#2563EB"]}
                    style={styles.timeIndicator}
                  />
                  <Text style={styles.startTime}>{item.startTime}</Text>
                  <Text style={styles.endTime}>{item.endTime}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.className}>{item.className}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Ionicons name="book" size={12} color="#3B82F6" />
                      <Text style={[styles.statusText, { color: "#3B82F6" }]}>
                        Lịch cố định
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subject}>{item.subject}</Text>
                  {item.room && (
                    <View style={styles.scheduleDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.detailText}>{item.room}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))
          )
        ) : /* Student Sessions View */
        filteredSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["#F3F4F6", "#E5E7EB"]}
              style={styles.emptyIconBg}
            >
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Không có lịch học</Text>
            <Text style={styles.emptyText}>
              Bạn không có buổi học nào trong ngày này
            </Text>
          </View>
        ) : (
          filteredSessions.map((session, index) => {
            const statusConfig = getStatusConfig(session.status);
            const className = getClassName(session);
            const subject = getSubject(session);
            return (
              <View key={session._id || index} style={styles.scheduleCard}>
                <View style={styles.timeColumn}>
                  <LinearGradient
                    colors={statusConfig.colors as [string, string]}
                    style={styles.timeIndicator}
                  />
                  <Text style={styles.startTime}>
                    {formatTime(session.startTime)}
                  </Text>
                  <Text style={styles.endTime}>
                    {formatTime(session.endTime)}
                  </Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.className}>{className}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${statusConfig.colors[0]}20` },
                      ]}
                    >
                      <Ionicons
                        name={statusConfig.icon as any}
                        size={12}
                        color={statusConfig.colors[0]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusConfig.colors[0] },
                        ]}
                      >
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                  {subject && <Text style={styles.subject}>{subject}</Text>}
                  <View style={styles.scheduleDetails}>
                    {user?.role !== "teacher" && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.detailText}>Giáo viên</Text>
                      </View>
                    )}
                    {session.note && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.detailText}>{session.note}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
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
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  weekNavButton: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dateCell: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    minWidth: (width - 48) / 7,
  },
  selectedDateCell: {
    backgroundColor: "#EFF6FF",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 8,
  },
  selectedDayText: {
    color: "#3B82F6",
  },
  todayDayText: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  selectedDateCircle: {
    backgroundColor: "#3B82F6",
  },
  todayDateCircle: {
    backgroundColor: "#DBEAFE",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  selectedDateText: {
    color: "#FFFFFF",
  },
  todayDateText: {
    color: "#3B82F6",
  },
  selectedDateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDateInfo: {
    flex: 1,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  selectedDateSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  sessionCount: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sessionCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  scheduleList: {
    flex: 1,
  },
  scheduleContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  scheduleCard: {
    flexDirection: "row",
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
  timeColumn: {
    alignItems: "center",
    marginRight: 16,
    width: 56,
  },
  timeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginBottom: 8,
  },
  startTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  endTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 4,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  subject: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 10,
  },
  scheduleDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
  },
});
