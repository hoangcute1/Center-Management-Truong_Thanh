import { useEffect, useState } from "react";
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
import { useScheduleStore } from "@/lib/stores";

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

// Status colors matching web
const getStatusConfig = (status?: string) => {
  switch (status) {
    case "present":
      return { colors: ["#10B981", "#059669"], icon: "checkmark-circle", label: "Có mặt" };
    case "absent":
      return { colors: ["#EF4444", "#DC2626"], icon: "close-circle", label: "Vắng" };
    case "late":
      return { colors: ["#F59E0B", "#D97706"], icon: "time", label: "Đi trễ" };
    case "excused":
      return { colors: ["#8B5CF6", "#7C3AED"], icon: "document-text", label: "Có phép" };
    default:
      return { colors: ["#3B82F6", "#2563EB"], icon: "calendar", label: "Sắp tới" };
  }
};

export default function ScheduleScreen() {
  const { schedule, isLoading, fetchSchedule } = useScheduleStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchSchedule();
  }, []);

  const onRefresh = async () => {
    await fetchSchedule();
  };

  // Generate dates for the week
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
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

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Week Calendar Header */}
      <View style={styles.calendarContainer}>
        <View style={styles.weekHeader}>
          <TouchableOpacity style={styles.weekNavButton}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.weekTitle}>
            Tháng {selectedDate.getMonth() + 1}, {selectedDate.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.weekNavButton}>
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
            {schedule.length} buổi học
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
        {schedule.length === 0 ? (
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
          schedule.map((item, index) => {
            const statusConfig = getStatusConfig(item.attendanceStatus);
            return (
              <View key={item._id || index} style={styles.scheduleCard}>
                <View style={styles.timeColumn}>
                  <LinearGradient
                    colors={statusConfig.colors as [string, string]}
                    style={styles.timeIndicator}
                  />
                  <Text style={styles.startTime}>{item.startTime}</Text>
                  <Text style={styles.endTime}>{item.endTime}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.className}>{item.className}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.colors[0]}20` }]}>
                      <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.colors[0]} />
                      <Text style={[styles.statusText, { color: statusConfig.colors[0] }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subject}>{item.subject}</Text>
                  <View style={styles.scheduleDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="person-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{item.teacherName}</Text>
                    </View>
                    {item.room && (
                      <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{item.room}</Text>
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
