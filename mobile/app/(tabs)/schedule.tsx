import { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useScheduleStore,
  useAuthStore,
  useClassesStore,
  useBranchesStore,
  useUsersStore,
} from "@/lib/stores";

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

interface TimetableItem {
  classId: string;
  className: string;
  subject: string;
  startTime: string;
  endTime: string;
  room?: string;
  teacherName?: string;
  branchName?: string;
  colorIndex?: number;
}

// Class colors for admin view
const CLASS_COLORS: [string, string][] = [
  ["#3B82F6", "#2563EB"],
  ["#10B981", "#059669"],
  ["#8B5CF6", "#7C3AED"],
  ["#F59E0B", "#D97706"],
  ["#EC4899", "#DB2777"],
  ["#14B8A6", "#0D9488"],
  ["#6366F1", "#4F46E5"],
  ["#F43F5E", "#E11D48"],
  ["#06B6D4", "#0891B2"],
  ["#84CC16", "#65A30D"],
];

// Time slots for admin timetable (7:00 - 21:00)
const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

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
  const { branches, fetchBranches } = useBranchesStore();
  const { users, fetchUsers } = useUsersStore();
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  // Admin filters
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "list">("day"); // Admin view modes
  const [selectedClassDetail, setSelectedClassDetail] = useState<any>(null);
  const [showClassDetailModal, setShowClassDetailModal] = useState(false);

  const isAdmin = user?.role === "admin";
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

  useEffect(() => {
    if (isAdmin) {
      fetchBranches();
      fetchUsers({ role: "teacher" });
    }
  }, [isAdmin]);

  const loadSchedule = async () => {
    if (!user) return;

    if (user.role === "teacher" || user.role === "admin") {
      // Fetch classes for teacher/admin to build timetable
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

  // Build timetable for admin - all classes with filters
  const adminTimetable = useMemo((): TimetableItem[] => {
    if (user?.role !== "admin") return [];

    const dayIndex = selectedDate.getDay();
    const timetable: TimetableItem[] = [];

    // Apply filters
    let filteredClasses = classes;

    if (selectedBranch) {
      filteredClasses = filteredClasses.filter((cls) => {
        const branchId =
          typeof cls.branchId === "string" ? cls.branchId : cls.branchId?._id;
        return branchId === selectedBranch;
      });
    }

    if (selectedClass) {
      filteredClasses = filteredClasses.filter(
        (cls) => cls._id === selectedClass,
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredClasses = filteredClasses.filter(
        (cls) =>
          cls.name.toLowerCase().includes(query) ||
          (cls.subject && cls.subject.toLowerCase().includes(query)),
      );
    }

    filteredClasses.forEach((cls, classIndex) => {
      const teacherName =
        typeof cls.teacherId === "object" && cls.teacherId?.name
          ? cls.teacherId.name
          : users.find((u) => u._id === cls.teacherId)?.name ||
            "Chưa phân công";

      const branchName =
        typeof cls.branchId === "object" && cls.branchId?.name
          ? cls.branchId.name
          : branches.find((b) => b._id === cls.branchId)?.name || "";

      if (cls.schedule && cls.schedule.length > 0) {
        cls.schedule.forEach((sch) => {
          if (sch.dayOfWeek === dayIndex) {
            timetable.push({
              classId: cls._id,
              className: cls.name,
              subject: cls.subject || "Chưa xác định",
              startTime: sch.startTime,
              endTime: sch.endTime,
              room: sch.room,
              teacherName,
              branchName,
              colorIndex: classIndex % CLASS_COLORS.length,
            });
          }
        });
      }
    });

    // Sort by start time
    timetable.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return timetable;
  }, [
    classes,
    selectedDate,
    user,
    selectedBranch,
    selectedClass,
    searchQuery,
    users,
    branches,
  ]);

  // Admin list view - all classes regardless of selected day
  const adminClassList = useMemo(() => {
    if (user?.role !== "admin") return [];

    let filteredClasses = classes;

    if (selectedBranch) {
      filteredClasses = filteredClasses.filter((cls) => {
        const branchId =
          typeof cls.branchId === "string" ? cls.branchId : cls.branchId?._id;
        return branchId === selectedBranch;
      });
    }

    if (selectedClass) {
      filteredClasses = filteredClasses.filter(
        (cls) => cls._id === selectedClass,
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredClasses = filteredClasses.filter(
        (cls) =>
          cls.name.toLowerCase().includes(query) ||
          (cls.subject && cls.subject.toLowerCase().includes(query)),
      );
    }

    return filteredClasses.map((cls, index) => {
      const teacherName =
        typeof cls.teacherId === "object" && cls.teacherId?.name
          ? cls.teacherId.name
          : users.find((u) => u._id === cls.teacherId)?.name ||
            "Chưa phân công";

      const branchName =
        typeof cls.branchId === "object" && cls.branchId?.name
          ? cls.branchId.name
          : branches.find((b) => b._id === cls.branchId)?.name || "";

      return {
        ...cls,
        teacherName,
        branchName,
        colorIndex: index % CLASS_COLORS.length,
      };
    });
  }, [
    classes,
    user,
    selectedBranch,
    selectedClass,
    searchQuery,
    users,
    branches,
  ]);

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

  // Format schedule for display
  const formatScheduleText = (schedule: any[]) => {
    if (!schedule || schedule.length === 0) return "Chưa có lịch";
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return schedule
      .map((s) => `${dayNames[s.dayOfWeek]} ${s.startTime}-${s.endTime}`)
      .join(", ");
  };

  // Handle class detail click
  const handleClassPress = (cls: any) => {
    setSelectedClassDetail(cls);
    setShowClassDetailModal(true);
  };

  // Render admin class card (list view)
  const renderAdminClassCard = (cls: any) => {
    const colors = CLASS_COLORS[cls.colorIndex || 0];
    return (
      <TouchableOpacity
        key={cls._id}
        style={styles.adminClassCard}
        onPress={() => handleClassPress(cls)}
        activeOpacity={0.7}
      >
        <LinearGradient colors={colors} style={styles.adminClassIndicator} />
        <View style={styles.adminClassContent}>
          <View style={styles.adminClassHeader}>
            <Text style={styles.adminClassName} numberOfLines={1}>
              {cls.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${colors[0]}20` },
              ]}
            >
              <Text style={[styles.statusText, { color: colors[0] }]}>
                {cls.schedule?.length || 0} buổi/tuần
              </Text>
            </View>
          </View>
          <Text style={styles.adminClassSubject} numberOfLines={1}>
            {cls.subject || "Chưa xác định"}
          </Text>
          <View style={styles.adminClassDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={12} color="#6B7280" />
              <Text style={styles.detailText} numberOfLines={1}>
                {cls.teacherName}
              </Text>
            </View>
            {cls.branchName && (
              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={12} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {cls.branchName}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.schedulePreview} numberOfLines={1}>
            <Ionicons name="time-outline" size={11} color="#9CA3AF" />{" "}
            {formatScheduleText(cls.schedule)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  // Render admin timetable item (day view)
  const renderAdminTimetableItem = (item: TimetableItem, index: number) => {
    const colors = CLASS_COLORS[item.colorIndex || 0];
    return (
      <TouchableOpacity
        key={`${item.classId}-${index}`}
        style={styles.scheduleCard}
        onPress={() => {
          const cls = adminClassList.find((c) => c._id === item.classId);
          if (cls) handleClassPress(cls);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.timeColumn}>
          <LinearGradient colors={colors} style={styles.timeIndicator} />
          <Text style={styles.startTime}>{item.startTime}</Text>
          <Text style={styles.endTime}>{item.endTime}</Text>
        </View>
        <View style={styles.scheduleInfo}>
          <View style={styles.scheduleHeader}>
            <Text
              style={styles.className}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.className}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${colors[0]}20` },
              ]}
            >
              <Ionicons name="repeat" size={10} color={colors[0]} />
              <Text style={[styles.statusText, { color: colors[0] }]}>
                Cố định
              </Text>
            </View>
          </View>
          <Text style={styles.subject} numberOfLines={1} ellipsizeMode="tail">
            {item.subject}
          </Text>
          <View style={styles.scheduleDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={12} color="#6B7280" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.teacherName}
              </Text>
            </View>
            {item.branchName && (
              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={12} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.branchName}
                </Text>
              </View>
            )}
            {item.room && (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.room}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Get selected branch name for display
  const selectedBranchName =
    branches.find((b) => b._id === selectedBranch)?.name || "Tất cả chi nhánh";

  // Admin View
  if (isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        {/* Admin Header with Filters */}
        <View style={styles.adminHeader}>
          <View style={styles.adminTitleRow}>
            <Text style={styles.adminTitle}>Lịch dạy học</Text>
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[
                  styles.viewModeBtn,
                  viewMode === "day" && styles.viewModeBtnActive,
                ]}
                onPress={() => setViewMode("day")}
              >
                <Ionicons
                  name="calendar"
                  size={16}
                  color={viewMode === "day" ? "#fff" : "#6B7280"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeBtn,
                  viewMode === "list" && styles.viewModeBtnActive,
                ]}
                onPress={() => setViewMode("list")}
              >
                <Ionicons
                  name="list"
                  size={16}
                  color={viewMode === "list" ? "#fff" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={18}
              color="#9CA3AF"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm lớp học..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Branch Filter */}
          <TouchableOpacity
            style={styles.filterPicker}
            onPress={() => setShowBranchPicker(true)}
          >
            <Ionicons name="business-outline" size={16} color="#6B7280" />
            <Text style={styles.filterPickerText} numberOfLines={1}>
              {selectedBranchName}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Week Calendar - only for day view */}
        {viewMode === "day" && (
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
              <TouchableOpacity
                style={styles.weekNavButton}
                onPress={goToNextWeek}
              >
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
                    style={[
                      styles.dateCell,
                      selected && styles.selectedDateCell,
                    ]}
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
        )}

        {/* Selected Date Header - only for day view */}
        {viewMode === "day" && (
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
                {adminTimetable.length} lớp học
              </Text>
            </View>
          </View>
        )}

        {/* Stats for list view */}
        {viewMode === "list" && (
          <View style={styles.adminStats}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#3B82F6", "#2563EB"]}
                style={styles.statIcon}
              >
                <Ionicons name="school" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statValue}>{adminClassList.length}</Text>
              <Text style={styles.statLabel}>Lớp học</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.statIcon}
              >
                <Ionicons name="person" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statValue}>
                {users.filter((u) => u.role === "teacher").length}
              </Text>
              <Text style={styles.statLabel}>Giáo viên</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                style={styles.statIcon}
              >
                <Ionicons name="business" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statValue}>{branches.length}</Text>
              <Text style={styles.statLabel}>Chi nhánh</Text>
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView
          style={styles.scheduleList}
          contentContainerStyle={[
            styles.scheduleContent,
            { paddingBottom: 100 },
          ]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {viewMode === "day" ? (
            // Day View - show timetable for selected day
            adminTimetable.length === 0 ? (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={["#F3F4F6", "#E5E7EB"]}
                  style={styles.emptyIconBg}
                >
                  <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>Không có lịch dạy</Text>
                <Text style={styles.emptyText}>
                  Không có lớp học nào trong ngày này
                </Text>
              </View>
            ) : (
              adminTimetable.map((item, index) =>
                renderAdminTimetableItem(item, index),
              )
            )
          ) : // List View - show all classes
          adminClassList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={["#F3F4F6", "#E5E7EB"]}
                style={styles.emptyIconBg}
              >
                <Ionicons name="school-outline" size={48} color="#9CA3AF" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Không có lớp học</Text>
              <Text style={styles.emptyText}>
                Chưa có lớp học nào trong hệ thống
              </Text>
            </View>
          ) : (
            adminClassList.map((cls) => renderAdminClassCard(cls))
          )}
        </ScrollView>

        {/* Branch Picker Modal */}
        <Modal
          visible={showBranchPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBranchPicker(false)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowBranchPicker(false)}
          >
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Chọn chi nhánh</Text>
                <TouchableOpacity onPress={() => setShowBranchPicker(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList}>
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    !selectedBranch && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedBranch("");
                    setShowBranchPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      !selectedBranch && styles.pickerItemTextActive,
                    ]}
                  >
                    Tất cả chi nhánh
                  </Text>
                  {!selectedBranch && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch._id}
                    style={[
                      styles.pickerItem,
                      selectedBranch === branch._id && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setSelectedBranch(branch._id);
                      setShowBranchPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedBranch === branch._id &&
                          styles.pickerItemTextActive,
                      ]}
                    >
                      {branch.name}
                    </Text>
                    {selectedBranch === branch._id && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Class Detail Modal */}
        <Modal
          visible={showClassDetailModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowClassDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.classDetailModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết lớp học</Text>
                <TouchableOpacity
                  onPress={() => setShowClassDetailModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {selectedClassDetail && (
                <ScrollView style={styles.classDetailContent}>
                  <View style={styles.classDetailSection}>
                    <Text style={styles.classDetailName}>
                      {selectedClassDetail.name}
                    </Text>
                    <Text style={styles.classDetailSubject}>
                      {selectedClassDetail.subject || "Chưa xác định"}
                    </Text>
                  </View>

                  <View style={styles.classDetailSection}>
                    <Text style={styles.sectionTitle}>Thông tin giảng dạy</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="person" size={16} color="#6B7280" />
                      <Text style={styles.infoText}>
                        GV: {selectedClassDetail.teacherName}
                      </Text>
                    </View>
                    {selectedClassDetail.branchName && (
                      <View style={styles.infoRow}>
                        <Ionicons name="business" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>
                          Chi nhánh: {selectedClassDetail.branchName}
                        </Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Ionicons name="people" size={16} color="#6B7280" />
                      <Text style={styles.infoText}>
                        Sĩ số: {selectedClassDetail.studentIds?.length || 0} học
                        sinh
                      </Text>
                    </View>
                  </View>

                  <View style={styles.classDetailSection}>
                    <Text style={styles.sectionTitle}>Lịch học cố định</Text>
                    {selectedClassDetail.schedule &&
                    selectedClassDetail.schedule.length > 0 ? (
                      selectedClassDetail.schedule.map(
                        (sch: any, idx: number) => (
                          <View key={idx} style={styles.scheduleItem}>
                            <View style={styles.scheduleDay}>
                              <Text style={styles.scheduleDayText}>
                                {fullDaysOfWeek[sch.dayOfWeek]}
                              </Text>
                            </View>
                            <Text style={styles.scheduleTime}>
                              {sch.startTime} - {sch.endTime}
                            </Text>
                            {sch.room && (
                              <Text style={styles.scheduleRoom}>
                                Phòng: {sch.room}
                              </Text>
                            )}
                          </View>
                        ),
                      )
                    ) : (
                      <Text style={styles.noScheduleText}>
                        Chưa có lịch học
                      </Text>
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Teacher/Student View (original)
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
                    <Text
                      style={styles.className}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.className}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Ionicons name="book" size={10} color="#3B82F6" />
                      <Text style={[styles.statusText, { color: "#3B82F6" }]}>
                        Cố định
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={styles.subject}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.subject}
                  </Text>
                  {item.room && (
                    <View style={styles.scheduleDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color="#6B7280"
                        />
                        <Text
                          style={styles.detailText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.room}
                        </Text>
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
                    <Text
                      style={styles.className}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {className}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${statusConfig.colors[0]}20` },
                      ]}
                    >
                      <Ionicons
                        name={statusConfig.icon as any}
                        size={10}
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
                  {subject && (
                    <Text
                      style={styles.subject}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {subject}
                    </Text>
                  )}
                  <View style={styles.scheduleDetails}>
                    {user?.role !== "teacher" && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="person-outline"
                          size={12}
                          color="#6B7280"
                        />
                        <Text
                          style={styles.detailText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          Giáo viên
                        </Text>
                      </View>
                    )}
                    {session.note && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color="#6B7280"
                        />
                        <Text
                          style={styles.detailText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {session.note}
                        </Text>
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
    paddingVertical: 14,
    paddingHorizontal: 8,
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
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  weekNavButton: {
    padding: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  weekTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dateCell: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    minWidth: (width - 48) / 7,
    maxWidth: (width - 24) / 7,
  },
  selectedDateCell: {
    backgroundColor: "#EFF6FF",
  },
  dayText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 6,
  },
  selectedDayText: {
    color: "#3B82F6",
  },
  todayDayText: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
    fontSize: 14,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDateInfo: {
    flex: 1,
    minWidth: 0,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  selectedDateSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sessionCount: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    flexShrink: 0,
  },
  sessionCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
  },
  scheduleList: {
    flex: 1,
  },
  scheduleContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
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
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  timeColumn: {
    alignItems: "center",
    marginRight: 12,
    width: 50,
    flexShrink: 0,
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
    minWidth: 0,
    overflow: "hidden",
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
    flexWrap: "nowrap",
  },
  className: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  subject: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  scheduleDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
    flexShrink: 1,
  },
  // Admin-specific styles
  adminHeader: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingTop: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  adminTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
  },
  viewModeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  viewModeBtnActive: {
    backgroundColor: "#3B82F6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
  },
  filterPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  filterPickerText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  adminStats: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  adminClassCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  adminClassIndicator: {
    width: 4,
    height: "100%",
    minHeight: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  adminClassContent: {
    flex: 1,
    minWidth: 0,
  },
  adminClassHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  adminClassName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  adminClassSubject: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  adminClassDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  schedulePreview: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
  },
  pickerList: {
    padding: 8,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: "#EFF6FF",
  },
  pickerItemText: {
    fontSize: 15,
    color: "#374151",
  },
  pickerItemTextActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  classDetailModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
  },
  classDetailContent: {
    padding: 16,
  },
  classDetailSection: {
    marginBottom: 20,
  },
  classDetailName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  classDetailSubject: {
    fontSize: 15,
    color: "#6B7280",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
  },
  scheduleItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scheduleDay: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scheduleDayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  scheduleRoom: {
    fontSize: 12,
    color: "#6B7280",
  },
  noScheduleText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
