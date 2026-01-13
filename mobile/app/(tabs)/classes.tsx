import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useClassesStore } from "@/lib/stores";
import { getSubjectLabel } from "@/lib/constants/subjects";

const { width } = Dimensions.get("window");

// Subject color mapping
const getSubjectColors = (subject: string): [string, string] => {
  const colorMap: Record<string, [string, string]> = {
    math: ["#3B82F6", "#2563EB"],
    english: ["#10B981", "#059669"],
    physics: ["#8B5CF6", "#7C3AED"],
    chemistry: ["#F59E0B", "#D97706"],
    biology: ["#EC4899", "#DB2777"],
    literature: ["#6366F1", "#4F46E5"],
    history: ["#F97316", "#EA580C"],
    geography: ["#14B8A6", "#0D9488"],
  };
  return colorMap[subject] || ["#6B7280", "#4B5563"];
};

export default function ClassesScreen() {
  const { classes, isLoading, fetchClasses } = useClassesStore();
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetchClasses();
  }, []);

  const onRefresh = async () => {
    await fetchClasses();
  };

  const filteredClasses = classes.filter((c) => {
    if (activeFilter === "active") return c.isActive;
    if (activeFilter === "inactive") return !c.isActive;
    return true;
  });

  const getScheduleText = (
    schedule: { dayOfWeek: number; startTime: string; endTime: string }[]
  ) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return schedule
      .map((s) => `${days[s.dayOfWeek]} ${s.startTime}-${s.endTime}`)
      .join(", ");
  };

  const renderClassItem = ({ item }: { item: any }) => {
    const subjectColors = getSubjectColors(item.subject);
    return (
      <TouchableOpacity style={styles.classCard} activeOpacity={0.7}>
        <View style={styles.classHeader}>
          <LinearGradient
            colors={item.isActive ? subjectColors : ["#E5E7EB", "#D1D5DB"]}
            style={styles.subjectIcon}
          >
            <Ionicons
              name="book"
              size={22}
              color={item.isActive ? "#FFFFFF" : "#9CA3AF"}
            />
          </LinearGradient>
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
            <View style={[styles.statusDot, item.isActive ? styles.activeDot : styles.inactiveDot]} />
            <Text
              style={[
                styles.statusText,
                item.isActive ? styles.activeText : styles.inactiveText,
              ]}
            >
              {item.isActive ? "Đang học" : "Kết thúc"}
            </Text>
          </View>
        </View>

        <View style={styles.classDetails}>
          {item.schedule && item.schedule.length > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconBg}>
                <Ionicons name="calendar-outline" size={14} color="#3B82F6" />
              </View>
              <Text style={styles.detailText}>
                {getScheduleText(item.schedule)}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIconBg}>
              <Ionicons name="people-outline" size={14} color="#10B981" />
            </View>
            <Text style={styles.detailText}>
              {item.studentIds?.length || 0}/{item.maxStudents} học sinh
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${((item.studentIds?.length || 0) / item.maxStudents) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBg}>
              <Ionicons name="cash-outline" size={14} color="#F59E0B" />
            </View>
            <Text style={styles.detailText}>
              {new Intl.NumberFormat("vi-VN").format(item.tuitionFee)} VNĐ/tháng
            </Text>
          </View>
        </View>

        <View style={styles.classFooter}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionText}>Chi tiết</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="checkbox-outline" size={18} color="#10B981" />
            <Text style={[styles.actionText, { color: "#10B981" }]}>Điểm danh</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filters = [
    { key: "all" as const, label: "Tất cả", count: classes.length },
    { key: "active" as const, label: "Đang học", count: classes.filter((c) => c.isActive).length },
    { key: "inactive" as const, label: "Đã kết thúc", count: classes.filter((c) => !c.isActive).length },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
              <View style={[styles.filterBadge, activeFilter === filter.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, activeFilter === filter.key && styles.filterBadgeTextActive]}>
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item._id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["#F3F4F6", "#E5E7EB"]}
              style={styles.emptyIconBg}
            >
              <Ionicons name="school-outline" size={48} color="#9CA3AF" />
            </LinearGradient>
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

// Need to import ScrollView
import { ScrollView } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterTabActive: {
    backgroundColor: "#EFF6FF",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginRight: 8,
  },
  filterTextActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  filterBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: "#3B82F6",
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterBadgeTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  classCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  classMainInfo: {
    flex: 1,
  },
  className: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 3,
  },
  classSubject: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: "#D1FAE5",
  },
  inactiveBadge: {
    backgroundColor: "#F3F4F6",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: "#10B981",
  },
  inactiveDot: {
    backgroundColor: "#9CA3AF",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeText: {
    color: "#059669",
  },
  inactiveText: {
    color: "#6B7280",
  },
  classDetails: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },
  progressBarBg: {
    width: 60,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  classFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 8,
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  emptyContainer: {
    flex: 1,
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
});
