import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useClassesStore } from "@/lib/stores";
import { getSubjectLabel } from "@/lib/constants/subjects";

export default function ClassesScreen() {
  const { classes, isLoading, fetchClasses } = useClassesStore();

  useEffect(() => {
    fetchClasses();
  }, []);

  const onRefresh = async () => {
    await fetchClasses();
  };

  const getScheduleText = (
    schedule: { dayOfWeek: number; startTime: string; endTime: string }[]
  ) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return schedule
      .map((s) => `${days[s.dayOfWeek]} ${s.startTime}-${s.endTime}`)
      .join(", ");
  };

  const renderClassItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.classCard}>
      <View style={styles.classHeader}>
        <View
          style={[
            styles.subjectIcon,
            { backgroundColor: item.isActive ? "#EFF6FF" : "#F3F4F6" },
          ]}
        >
          <Ionicons
            name="book"
            size={24}
            color={item.isActive ? "#3B82F6" : "#9CA3AF"}
          />
        </View>
        <View style={styles.classMainInfo}>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.classSubject}>
            {getSubjectLabel(item.subject)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.isActive ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.isActive ? styles.activeText : styles.inactiveText,
            ]}
          >
            {item.isActive ? "Đang học" : "Đã kết thúc"}
          </Text>
        </View>
      </View>

      <View style={styles.classDetails}>
        {item.schedule && item.schedule.length > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {getScheduleText(item.schedule)}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.studentIds?.length || 0}/{item.maxStudents} học sinh
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {new Intl.NumberFormat("vi-VN").format(item.tuitionFee)} VNĐ/tháng
          </Text>
        </View>
      </View>

      <View style={styles.classFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#3B82F6"
          />
          <Text style={styles.actionText}>Chi tiết</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="people-outline" size={18} color="#3B82F6" />
          <Text style={styles.actionText}>Điểm danh</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item._id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Chưa có lớp học</Text>
            <Text style={styles.emptyText}>
              Bạn chưa được phân công vào lớp học nào
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  classCard: {
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
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  classMainInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  classSubject: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#D1FAE5",
  },
  inactiveBadge: {
    backgroundColor: "#F3F4F6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  activeText: {
    color: "#059669",
  },
  inactiveText: {
    color: "#6B7280",
  },
  classDetails: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
    flex: 1,
  },
  classFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
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
});
