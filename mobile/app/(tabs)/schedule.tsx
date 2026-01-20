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
  Alert,
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
  useAttendanceStore,
} from "@/lib/stores";
import api from "@/lib/api";

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

  // Teacher attendance states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceClassId, setAttendanceClassId] = useState<string | null>(
    null,
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    {
      studentId: string;
      name: string;
      email: string;
      status: "present" | "absent" | "late" | "excused" | null;
    }[]
  >([]);
  const [attendanceNote, setAttendanceNote] = useState("");
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] =
    useState<TimetableItem | null>(null);

  // Teacher view mode: week (giống web) hoặc day (xem theo ngày)
  const [teacherViewMode, setTeacherViewMode] = useState<"week" | "day">(
    "week",
  );

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
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
  // Build timetable for teacher from class schedules
  const teacherTimetable = useMemo((): TimetableItem[] => {
    if (user?.role !== "teacher") return [];

    const dayIndex = selectedDate.getDay();
    const timetable: TimetableItem[] = [];

    // Filter classes taught by this teacher
    const teacherClasses = classes.filter((cls) => {
      const teacherId =
        typeof cls.teacherId === "object" && cls.teacherId
          ? (cls.teacherId as any)._id
          : cls.teacherId;
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

  // Build timetable by week for teacher (giống web)
  interface DaySchedule {
    day: string;
    date: string;
    schedules: (TimetableItem & { studentCount: number })[];
    fullDate: Date;
  }

  const teacherTimetableByWeek = useMemo((): DaySchedule[] => {
    if (user?.role !== "teacher") return [];

    const dayNamesVN = [
      "CHỦ NHẬT",
      "THỨ HAI",
      "THỨ BA",
      "THỨ TƯ",
      "THỨ NĂM",
      "THỨ SÁU",
      "THỨ BẢY",
    ];

    const days: DaySchedule[] = [];

    // Filter classes taught by this teacher
    const teacherClasses = classes.filter((cls) => {
      const teacherId =
        typeof cls.teacherId === "object" && cls.teacherId
          ? (cls.teacherId as any)._id
          : cls.teacherId;
      return teacherId === user._id;
    });

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const dayIndex = date.getDay();

      // Find all class schedules for this day
      const daySchedules: (TimetableItem & { studentCount: number })[] = [];

      teacherClasses.forEach((cls) => {
        if (cls.schedule && cls.schedule.length > 0) {
          cls.schedule.forEach((sch) => {
            if (sch.dayOfWeek === dayIndex) {
              const studentCount =
                cls.students?.length || cls.studentIds?.length || 0;
              daySchedules.push({
                classId: cls._id,
                className: cls.name,
                subject: cls.subject || "Chưa xác định",
                startTime: sch.startTime,
                endTime: sch.endTime,
                room: sch.room,
                studentCount,
              });
            }
          });
        }
      });

      // Sort by start time
      daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

      days.push({
        day: dayNamesVN[dayIndex],
        date: date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        schedules: daySchedules,
        fullDate: date,
      });
    }

    // Reorder so Monday is first
    const mondayIndex = days.findIndex((d) => d.day === "THỨ HAI");
    return [...days.slice(mondayIndex), ...days.slice(0, mondayIndex)];
  }, [classes, currentWeekStart, user]);

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
    // Try to find in classes store
    if (typeof session.classId === "string") {
       const cls = classes.find(c => c._id === session.classId);
       if (cls) return cls.name;
    }
    return "Chưa xác định";
  };

  // Get subject from session
  const getSubject = (session: any) => {
    if (typeof session.classId === "object" && session.classId?.subject) {
      return session.classId.subject;
    }
     // Try to find in classes store
    if (typeof session.classId === "string") {
       const cls = classes.find(c => c._id === session.classId);
       if (cls && cls.subject) return cls.subject;
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

  // Helper function to check if current time is within class schedule time
  const isWithinClassTime = (
    scheduleDate: Date,
    startTime: string,
    endTime: string,
  ): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const schedDay = new Date(
      scheduleDate.getFullYear(),
      scheduleDate.getMonth(),
      scheduleDate.getDate(),
    );

    // Check if same day
    if (today.getTime() !== schedDay.getTime()) {
      return false;
    }

    // Parse times
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const currentMinutes = currentHour * 60 + currentMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Allow 15 minutes before and after class time
    return (
      currentMinutes >= startMinutes - 15 && currentMinutes <= endMinutes + 15
    );
  };

  // Handle attendance for teacher
  // State to track which date is being used for attendance
  const [attendanceDate, setAttendanceDate] = useState<Date>(selectedDate);

  const handleOpenAttendance = async (
    item: TimetableItem,
    scheduleDate?: Date,
  ) => {
    const classData = classes.find((c) => c._id === item.classId);
    if (!classData) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin lớp học");
      return;
    }

    const students = classData.students || [];
    if (students.length === 0) {
      Alert.alert("Thông báo", "Lớp học này chưa có học sinh nào");
      return;
    }

    // Use scheduleDate if provided (from week view), otherwise use selectedDate
    const dateForAttendance = scheduleDate || selectedDate;
    setAttendanceDate(dateForAttendance);

    // Check if within class time
    const canAttend = isWithinClassTime(
      dateForAttendance,
      item.startTime,
      item.endTime,
    );
    if (!canAttend) {
      Alert.alert(
        "Thông báo",
        `Chỉ có thể điểm danh trong khoảng thời gian học (${item.startTime} - ${item.endTime}). Vui lòng quay lại đúng giờ học.`,
      );
      return;
    }

    setAttendanceClassId(item.classId);
    setSelectedScheduleItem(item);

    // Initialize attendance records
    setAttendanceRecords(
      students.map((s) => ({
        studentId: s._id,
        name: s.fullName || s.name || "Học sinh",
        email: s.email,
        status: null,
      })),
    );
    setAttendanceNote("");

    // Try to fetch existing attendance for this class and date
    try {
      const response = await api.get("/attendance/by-class-date", {
        params: {
          classId: item.classId,
          date: dateForAttendance.toISOString(),
        },
      });
      const existingRecords = response.data || [];

      if (existingRecords.length > 0) {
        setAttendanceRecords((prevRows) =>
          prevRows.map((row) => {
            const existingRecord = existingRecords.find(
              (r: any) =>
                r.studentId === row.studentId ||
                r.studentId?._id === row.studentId,
            );
            if (existingRecord) {
              return { ...row, status: existingRecord.status };
            }
            return row;
          }),
        );
      }
    } catch (error) {
      console.log("No existing attendance records");
    }

    setShowAttendanceModal(true);
  };

  // Update attendance status for a student
  const updateAttendanceStatus = (
    studentId: string,
    status: "present" | "absent" | "late" | "excused" | null,
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)),
    );
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    if (!attendanceClassId || !selectedScheduleItem) return;

    setIsSavingAttendance(true);
    try {
      // Save each attendance record using attendanceDate
      for (const record of attendanceRecords) {
        if (record.status) {
          await api.post("/attendance", {
            classId: attendanceClassId,
            studentId: record.studentId,
            status: record.status,
            date: attendanceDate.toISOString(),
            notes: attendanceNote,
          });
        }
      }

      Alert.alert("Thành công", "Đã lưu điểm danh thành công");
      setShowAttendanceModal(false);
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể lưu điểm danh. Vui lòng thử lại.",
      );
    } finally {
      setIsSavingAttendance(false);
    }
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

  // Teacher View with Week/Day toggle
  if (isTeacher) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        {/* Teacher Header with View Mode Toggle */}
        <View style={styles.teacherHeader}>
          <View style={styles.teacherTitleRow}>
            <Text style={styles.teacherTitle}>Lịch dạy của tôi</Text>
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[
                  styles.viewModeBtn,
                  teacherViewMode === "week" && styles.viewModeBtnActive,
                ]}
                onPress={() => setTeacherViewMode("week")}
              >
                <Ionicons
                  name="grid"
                  size={16}
                  color={teacherViewMode === "week" ? "#fff" : "#6B7280"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeBtn,
                  teacherViewMode === "day" && styles.viewModeBtnActive,
                ]}
                onPress={() => setTeacherViewMode("day")}
              >
                <Ionicons
                  name="list"
                  size={16}
                  color={teacherViewMode === "day" ? "#fff" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Navigation */}
          <View style={styles.weekNavRow}>
            <TouchableOpacity
              style={styles.weekNavBtnSmall}
              onPress={goToPreviousWeek}
            >
              <Ionicons name="chevron-back" size={18} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.weekNavText}>
              Tuần{" "}
              {currentWeekStart.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
              })}{" "}
              -{" "}
              {new Date(
                currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
              })}
            </Text>
            <TouchableOpacity
              style={styles.weekNavBtnSmall}
              onPress={goToNextWeek}
            >
              <Ionicons name="chevron-forward" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* WEEK VIEW - Hiển thị giống web */}
        {teacherViewMode === "week" ? (
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
            {/* Stats Row */}
            <View style={styles.teacherWeekStats}>
              <View style={styles.statCardSmall}>
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  style={styles.statIconSmall}
                >
                  <Ionicons name="calendar" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValueSmall}>
                  {teacherTimetableByWeek.reduce(
                    (sum, day) => sum + day.schedules.length,
                    0,
                  )}
                </Text>
                <Text style={styles.statLabelSmall}>Buổi dạy/tuần</Text>
              </View>
              <View style={styles.statCardSmall}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.statIconSmall}
                >
                  <Ionicons name="people" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValueSmall}>
                  {classes
                    .filter((c) => {
                      const teacherId =
                        typeof c.teacherId === "string"
                          ? c.teacherId
                          : c.teacherId;
                      return teacherId === user._id;
                    })
                    .reduce(
                      (sum, c) =>
                        sum + (c.students?.length || c.studentIds?.length || 0),
                      0,
                    )}
                </Text>
                <Text style={styles.statLabelSmall}>Học sinh</Text>
              </View>
              <View style={styles.statCardSmall}>
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  style={styles.statIconSmall}
                >
                  <Ionicons name="school" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValueSmall}>
                  {
                    classes.filter((c) => {
                      const teacherId =
                        typeof c.teacherId === "string"
                          ? c.teacherId
                          : c.teacherId;
                      return teacherId === user._id;
                    }).length
                  }
                </Text>
                <Text style={styles.statLabelSmall}>Lớp học</Text>
              </View>
            </View>

            {/* Week Grid */}
            <View style={styles.weekGrid}>
              {teacherTimetableByWeek.map((dayData, dayIdx) => {
                const isCurrentDay =
                  dayData.fullDate.toDateString() === new Date().toDateString();
                return (
                  <View
                    key={dayIdx}
                    style={[
                      styles.dayColumn,
                      isCurrentDay && styles.dayColumnToday,
                    ]}
                  >
                    {/* Day Header */}
                    <LinearGradient
                      colors={
                        isCurrentDay
                          ? ["#10B981", "#059669"]
                          : ["#3B82F6", "#2563EB"]
                      }
                      style={styles.dayHeader}
                    >
                      <Text style={styles.dayHeaderText}>
                        {dayData.day
                          .replace("THỨ ", "T")
                          .replace("CHỦ NHẬT", "CN")}
                      </Text>
                      <Text style={styles.dayHeaderDate}>{dayData.date}</Text>
                    </LinearGradient>

                    {/* Day Content */}
                    {dayData.schedules.length === 0 ? (
                      <View style={styles.emptyDayContent}>
                        <Text style={styles.emptyDayText}>-</Text>
                      </View>
                    ) : (
                      <View style={styles.dayContent}>
                        {dayData.schedules.map((sch, schIdx) => {
                          const canAttend = isWithinClassTime(
                            dayData.fullDate,
                            sch.startTime,
                            sch.endTime,
                          );

                          return (
                            <TouchableOpacity
                              key={`${sch.classId}-${schIdx}`}
                              style={[
                                styles.weekScheduleCard,
                                canAttend && styles.weekScheduleCardActive,
                              ]}
                              onPress={() =>
                                handleOpenAttendance(sch, dayData.fullDate)
                              }
                              activeOpacity={0.7}
                            >
                              <Text
                                style={styles.weekCardClassName}
                                numberOfLines={1}
                              >
                                {sch.className}
                              </Text>
                              <Text
                                style={styles.weekCardSubject}
                                numberOfLines={1}
                              >
                                {sch.subject}
                              </Text>
                              {sch.room && (
                                <View style={styles.weekCardInfoRow}>
                                  <Ionicons
                                    name="location"
                                    size={10}
                                    color="#6B7280"
                                  />
                                  <Text style={styles.weekCardInfoText}>
                                    {sch.room}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.weekCardTimeBox}>
                                <Ionicons
                                  name="time"
                                  size={10}
                                  color="#374151"
                                />
                                <Text style={styles.weekCardTime}>
                                  {sch.startTime} - {sch.endTime}
                                </Text>
                              </View>
                              <View style={styles.weekCardInfoRow}>
                                <Ionicons
                                  name="people"
                                  size={10}
                                  color="#6B7280"
                                />
                                <Text style={styles.weekCardInfoText}>
                                  {sch.studentCount} học sinh
                                </Text>
                              </View>
                              {canAttend && (
                                <View style={styles.weekCardActiveIndicator}>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={12}
                                    color="#059669"
                                  />
                                  <Text style={styles.weekCardActiveText}>
                                    Đang trong giờ học
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          /* DAY VIEW - Original day-by-day view */
          <>
            {/* Week Calendar Header */}
            <View style={styles.calendarContainer}>
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
                  {teacherTimetable.length} buổi dạy
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
              {teacherTimetable.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <LinearGradient
                    colors={["#F3F4F6", "#E5E7EB"]}
                    style={styles.emptyIconBg}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={48}
                      color="#9CA3AF"
                    />
                  </LinearGradient>
                  <Text style={styles.emptyTitle}>Không có lịch dạy</Text>
                  <Text style={styles.emptyText}>
                    Bạn không có tiết dạy nào trong ngày này
                  </Text>
                </View>
              ) : (
                teacherTimetable.map((item, index) => {
                  const classData = classes.find((c) => c._id === item.classId);
                  const studentCount =
                    classData?.students?.length ||
                    classData?.studentIds?.length ||
                    0;
                  const canAttend = isWithinClassTime(
                    selectedDate,
                    item.startTime,
                    item.endTime,
                  );

                  return (
                    <View
                      key={`${item.classId}-${index}`}
                      style={[
                        styles.teacherScheduleCard,
                        canAttend && styles.teacherScheduleCardActive,
                      ]}
                    >
                      <View style={styles.timeColumn}>
                        <LinearGradient
                          colors={
                            canAttend
                              ? ["#10B981", "#059669"]
                              : ["#3B82F6", "#2563EB"]
                          }
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
                              {
                                backgroundColor: canAttend
                                  ? "#D1FAE5"
                                  : "#DBEAFE",
                              },
                            ]}
                          >
                            <Ionicons
                              name={canAttend ? "checkmark-circle" : "time"}
                              size={10}
                              color={canAttend ? "#059669" : "#3B82F6"}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                { color: canAttend ? "#059669" : "#3B82F6" },
                              ]}
                            >
                              {canAttend ? "Đang diễn ra" : "Sắp tới"}
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

                        {/* Class info */}
                        <View style={styles.classInfoRow}>
                          <View style={styles.detailItem}>
                            <Ionicons
                              name="people-outline"
                              size={12}
                              color="#6B7280"
                            />
                            <Text style={styles.detailText}>
                              {studentCount} học sinh
                            </Text>
                          </View>
                          {item.room && (
                            <View style={styles.detailItem}>
                              <Ionicons
                                name="location-outline"
                                size={12}
                                color="#6B7280"
                              />
                              <Text style={styles.detailText} numberOfLines={1}>
                                {item.room}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Attendance button */}
                        <TouchableOpacity
                          style={[
                            styles.attendanceButton,
                            !canAttend && styles.attendanceButtonDisabled,
                          ]}
                          onPress={() => handleOpenAttendance(item)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="checkmark-done-circle"
                            size={16}
                            color={canAttend ? "#FFFFFF" : "#9CA3AF"}
                          />
                          <Text
                            style={[
                              styles.attendanceButtonText,
                              !canAttend && styles.attendanceButtonTextDisabled,
                            ]}
                          >
                            {canAttend ? "Điểm danh" : "Chưa đến giờ"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </>
        )}

        {/* Teacher Attendance Modal */}
        <Modal
          visible={showAttendanceModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAttendanceModal(false)}
        >
          <SafeAreaView style={styles.attendanceModalContainer}>
            {/* Modal Header */}
            <View style={styles.attendanceModalHeader}>
              <TouchableOpacity
                onPress={() => setShowAttendanceModal(false)}
                style={styles.attendanceCloseBtn}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.attendanceModalTitle}>Điểm danh</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Class Info */}
            {selectedScheduleItem && (
              <View style={styles.attendanceClassInfo}>
                <Text style={styles.attendanceClassName}>
                  {selectedScheduleItem.className}
                </Text>
                <Text style={styles.attendanceDateTime}>
                  {fullDaysOfWeek[attendanceDate.getDay()]},{" "}
                  {attendanceDate.toLocaleDateString("vi-VN")} •{" "}
                  {selectedScheduleItem.startTime} -{" "}
                  {selectedScheduleItem.endTime}
                </Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.attendanceStats}>
              <View style={styles.attendanceStat}>
                <Text style={styles.attendanceStatValue}>
                  {attendanceRecords.length}
                </Text>
                <Text style={styles.attendanceStatLabel}>Tổng số</Text>
              </View>
              <View
                style={[styles.attendanceStat, { backgroundColor: "#D1FAE5" }]}
              >
                <Text
                  style={[styles.attendanceStatValue, { color: "#059669" }]}
                >
                  {
                    attendanceRecords.filter(
                      (r) => r.status === "present" || r.status === "late",
                    ).length
                  }
                </Text>
                <Text style={styles.attendanceStatLabel}>Có mặt</Text>
              </View>
              <View
                style={[styles.attendanceStat, { backgroundColor: "#FEE2E2" }]}
              >
                <Text
                  style={[styles.attendanceStatValue, { color: "#DC2626" }]}
                >
                  {
                    attendanceRecords.filter((r) => r.status === "absent")
                      .length
                  }
                </Text>
                <Text style={styles.attendanceStatLabel}>Vắng</Text>
              </View>
            </View>

            <ScrollView style={styles.attendanceList}>
              {attendanceRecords.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>
                    Lớp học chưa có học sinh
                  </Text>
                </View>
              ) : (
                attendanceRecords.map((record) => (
                  <View key={record.studentId} style={styles.attendanceRow}>
                    <View style={styles.attendanceStudentInfo}>
                      <LinearGradient
                        colors={["#10B981", "#059669"]}
                        style={styles.attendanceAvatar}
                      >
                        <Text style={styles.attendanceAvatarText}>
                          {record.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                      <View style={styles.attendanceStudentDetails}>
                        <Text style={styles.attendanceStudentName}>
                          {record.name}
                        </Text>
                        <Text style={styles.attendanceStudentEmail}>
                          {record.email}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.attendanceButtons}>
                      <TouchableOpacity
                        style={[
                          styles.attendanceStatusBtn,
                          record.status === "present" &&
                            styles.attendanceStatusBtnActive,
                        ]}
                        onPress={() =>
                          updateAttendanceStatus(record.studentId, "present")
                        }
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={
                            record.status === "present" ? "#FFFFFF" : "#10B981"
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.attendanceStatusBtn,
                          styles.attendanceStatusBtnAbsent,
                          record.status === "absent" &&
                            styles.attendanceStatusBtnAbsentActive,
                        ]}
                        onPress={() =>
                          updateAttendanceStatus(record.studentId, "absent")
                        }
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color={
                            record.status === "absent" ? "#FFFFFF" : "#EF4444"
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.attendanceStatusBtn,
                          styles.attendanceStatusBtnLate,
                          record.status === "late" &&
                            styles.attendanceStatusBtnLateActive,
                        ]}
                        onPress={() =>
                          updateAttendanceStatus(record.studentId, "late")
                        }
                      >
                        <Ionicons
                          name="time"
                          size={16}
                          color={
                            record.status === "late" ? "#FFFFFF" : "#F59E0B"
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              {/* Note input */}
              <View style={styles.attendanceNoteSection}>
                <Text style={styles.attendanceNoteLabel}>Ghi chú buổi học</Text>
                <TextInput
                  style={styles.attendanceNoteInput}
                  placeholder="Nội dung dạy, bài tập giao..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={attendanceNote}
                  onChangeText={setAttendanceNote}
                />
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.attendanceSaveContainer}>
              <TouchableOpacity
                style={[
                  styles.attendanceSaveBtn,
                  isSavingAttendance && styles.attendanceSaveBtnDisabled,
                ]}
                onPress={handleSaveAttendance}
                disabled={isSavingAttendance}
              >
                <LinearGradient
                  colors={
                    isSavingAttendance
                      ? ["#D1D5DB", "#9CA3AF"]
                      : ["#10B981", "#059669"]
                  }
                  style={styles.attendanceSaveBtnGradient}
                >
                  {isSavingAttendance ? (
                    <Text style={styles.attendanceSaveBtnText}>
                      Đang lưu...
                    </Text>
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.attendanceSaveBtnText}>
                        Lưu điểm danh
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  // Student View (original)
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
            
            // Check if there are any sessions for this date
            const hasSessions = sessions.some(s => {
                const sDate = new Date(s.startTime);
                return sDate.getDate() === date.getDate() && 
                       sDate.getMonth() === date.getMonth() && 
                       sDate.getFullYear() === date.getFullYear();
            });

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
                {/* Session Indicator Dot */}
                {hasSessions && (
                    <View style={[
                        styles.sessionDot, 
                        selected ? { backgroundColor: "#FFFFFF" } : 
                        today ? { backgroundColor: "#3B82F6" } : 
                        { backgroundColor: "#10B981" }
                    ]} />
                )}
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
            {filteredSessions.length} buổi học
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
        {filteredSessions.length === 0 ? (
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
  sessionDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#10B981",
      marginTop: 4,
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
  // Teacher Schedule Card
  teacherScheduleCard: {
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
  classInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
  },
  attendanceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  attendanceButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  attendanceButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  attendanceButtonTextDisabled: {
    color: "#9CA3AF",
  },
  // Attendance Modal Styles
  attendanceModalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  attendanceModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  attendanceCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  attendanceModalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  attendanceClassInfo: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  attendanceClassName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  attendanceDateTime: {
    fontSize: 14,
    color: "#6B7280",
  },
  attendanceStats: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  attendanceStat: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  attendanceStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  attendanceStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  attendanceList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  attendanceStudentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  attendanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  attendanceAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  attendanceStudentDetails: {
    flex: 1,
  },
  attendanceStudentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  attendanceStudentEmail: {
    fontSize: 12,
    color: "#6B7280",
  },
  attendanceButtons: {
    flexDirection: "row",
    gap: 6,
  },
  attendanceStatusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  attendanceStatusBtnActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  attendanceStatusBtnAbsent: {
    borderColor: "#EF4444",
  },
  attendanceStatusBtnAbsentActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  attendanceStatusBtnLate: {
    borderColor: "#F59E0B",
  },
  attendanceStatusBtnLateActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B",
  },
  attendanceNoteSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  attendanceNoteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  attendanceNoteInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    textAlignVertical: "top",
  },
  attendanceSaveContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  attendanceSaveBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  attendanceSaveBtnDisabled: {
    opacity: 0.7,
  },
  attendanceSaveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  attendanceSaveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // ========== TEACHER WEEK VIEW STYLES ==========
  teacherHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  teacherTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  teacherTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  weekNavRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  weekNavBtnSmall: {
    padding: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  weekNavText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  teacherWeekStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  statLabelSmall: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  weekGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayColumn: {
    width: (width - 48) / 2,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dayColumnToday: {
    borderWidth: 2,
    borderColor: "#10B981",
  },
  dayHeader: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dayHeaderDate: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    marginTop: 1,
  },
  emptyDayContent: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDayText: {
    fontSize: 16,
    color: "#D1D5DB",
  },
  dayContent: {
    padding: 8,
    gap: 8,
  },
  weekScheduleCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  weekScheduleCardActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
    borderWidth: 2,
  },
  weekCardClassName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF",
    textAlign: "center",
    marginBottom: 4,
  },
  weekCardSubject: {
    fontSize: 11,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 6,
  },
  weekCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 4,
  },
  weekCardInfoText: {
    fontSize: 10,
    color: "#6B7280",
  },
  weekCardTimeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    marginBottom: 4,
  },
  weekCardTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },
  weekCardActiveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  weekCardActiveText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#059669",
  },
  teacherScheduleCardActive: {
    borderWidth: 2,
    borderColor: "#10B981",
  },
});
