import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { gradingService, StudentGradeRecord } from "@/lib/services/grading.service";

export default function GradesListScreen() {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState<StudentGradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGrades = useCallback(async () => {
    if (!user?._id) return;
    try {
      if (!refreshing) setLoading(true); // Don't show full loader on refresh
      const data = await gradingService.getMyGrades(user._id);
      setGrades(data);
    } catch (e) {
      console.error("Failed to fetch grades:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id, refreshing]);

  useEffect(() => {
    fetchGrades();
  }, []); // Run once on mount (and when user is available via internal check) But useCallback dep makes it safe.

  const onRefresh = () => {
    setRefreshing(true);
    fetchGrades();
  };

  const processedSubjects = useMemo(() => {
    if (!grades.length) return [];

    const groups: Record<string, StudentGradeRecord[]> = {};
    grades.forEach(g => {
      const key = g.classId?._id || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(g);
    });

    return Object.keys(groups).map(classId => {
      const list = groups[classId];
      // Sort by date desc
      list.sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

      const subjectName = list[0]?.classId?.name || "Môn học";
      const teacherName = list[0]?.gradedBy?.name || "Giáo viên";

      // Calculate Average
      let totalScore = 0;
      let totalMax = 0;
      list.forEach(g => {
        totalScore += g.score;
        totalMax += g.maxScore;
      });

      let avgScore = 0;
      if (totalMax > 0) {
        avgScore = (totalScore / totalMax) * 10;
      }

      const avg = parseFloat(avgScore.toFixed(1));

      // Trend
      let trend: 'up' | 'down' | 'same' = 'same';
      if (list.length >= 2) {
        const latest = (list[0].score / list[0].maxScore) * 10;
        const previous = (list[1].score / list[1].maxScore) * 10;
        if (latest > previous) trend = 'up';
        else if (latest < previous) trend = 'down';
      } else if (list.length === 1) {
        trend = 'same';
      }

      return {
        id: classId,
        name: subjectName,
        teacher: teacherName,
        avgScore: avg,
        trend
      };
    });
  }, [grades]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả học tập</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Danh sách môn học</Text>
        <Text style={styles.sectionSubtitle}>
          Chọn môn học để xem chi tiết điểm số và nhận xét
        </Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
        ) : processedSubjects.length > 0 ? (
          processedSubjects.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={styles.subjectCard}
              onPress={() =>
                router.push(
                  `/grades/${sub.id}?name=${encodeURIComponent(sub.name)}`
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.subjectIcon}>
                <Text style={styles.subjectIconText}>{sub.name.charAt(0)}</Text>
              </View>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{sub.name}</Text>
                <Text style={styles.teacherName}>{sub.teacher}</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text
                  style={[
                    styles.scoreValue,
                    sub.avgScore >= 8
                      ? { color: "#10B981" }
                      : sub.avgScore >= 6.5
                        ? { color: "#3B82F6" }
                        : { color: "#F59E0B" },
                  ]}
                >
                  {sub.avgScore}
                </Text>
                {sub.trend === "up" && (
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                )}
                {sub.trend === "down" && (
                  <Ionicons name="trending-down" size={16} color="#EF4444" />
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>Không có dữ liệu điểm số nào.</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  subjectIconText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 13,
    color: "#6B7280",
  },
  scoreContainer: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
});
