import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useScheduleStore } from "@/lib/stores";

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
      {/* Week Calendar */}
      <View style={styles.calendarContainer}>
        <View style={styles.weekRow}>
          {weekDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCell,
                isSelected(date) && styles.selectedDateCell,
                isToday(date) && !isSelected(date) && styles.todayDateCell,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected(date) && styles.selectedDayText,
                ]}
              >
                {daysOfWeek[(index + 1) % 7]}
              </Text>
              <Text
                style={[
                  styles.dateText,
                  isSelected(date) && styles.selectedDateText,
                  isToday(date) && !isSelected(date) && styles.todayDateText,
                ]}
              >
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Date Header */}
      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateTitle}>
          {fullDaysOfWeek[selectedDate.getDay()]},{" "}
          {selectedDate.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      {/* Schedule List */}
      <ScrollView
        style={styles.scheduleList}
        contentContainerStyle={styles.scheduleContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {schedule.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Không có lịch học</Text>
            <Text style={styles.emptyText}>
              Bạn không có buổi học nào trong ngày này
            </Text>
          </View>
        ) : (
          schedule.map((item, index) => (
            <View key={item._id || index} style={styles.scheduleCard}>
              <View style={styles.timeColumn}>
                <Text style={styles.startTime}>{item.startTime}</Text>
                <View style={styles.timeLine} />
                <Text style={styles.endTime}>{item.endTime}</Text>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.className}>{item.className}</Text>
                <Text style={styles.subject}>{item.subject}</Text>
                <View style={styles.scheduleDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="person" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{item.teacherName}</Text>
                  </View>
                  {item.room && (
                    <View style={styles.detailItem}>
                      <Ionicons name="location" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{item.room}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dateCell: {
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    minWidth: 44,
  },
  selectedDateCell: {
    backgroundColor: "#3B82F6",
  },
  todayDateCell: {
    backgroundColor: "#EFF6FF",
  },
  dayText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  selectedDayText: {
    color: "#FFFFFF",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  selectedDateText: {
    color: "#FFFFFF",
  },
  todayDateText: {
    color: "#3B82F6",
  },
  selectedDateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  scheduleList: {
    flex: 1,
  },
  scheduleContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  scheduleCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timeColumn: {
    alignItems: "center",
    marginRight: 16,
    width: 48,
  },
  startTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  timeLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  endTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  scheduleInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  subject: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  scheduleDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
  },
});
