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
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { gradingService, StudentGradeRecord } from "@/lib/services/grading.service";

const CATEGORY_LABELS: Record<string, string> = {
  'test_15p': 'Kiểm tra 15 phút',
  'test_45p': 'Kiểm tra 1 tiết',
  'test_60p': 'Kiểm tra 1 tiết',
  'mid_term': 'Thi giữa kỳ',
  'final_term': 'Thi cuối kỳ',
  'assignment': 'Bài tập về nhà',
  'other': 'Khác'
};

export default function GradeDetailScreen() {
  const { id, name } = useLocalSearchParams(); // id is classId
  const subjectName = typeof name === "string" ? name : "Chi tiết môn học";

  const { user } = useAuthStore();
  const [grades, setGrades] = useState<StudentGradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filtered grades for this class
  const classGrades = useMemo(() => {
    if (!grades.length) return [];
    // Filter by classId
    return grades.filter(g => g.classId?._id === id);
  }, [grades, id]);

  const fetchGrades = useCallback(async () => {
    if (!user?._id) return;
    try {
      if (!refreshing) setLoading(true);
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
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGrades();
  };

  // Calculate Statistics
  const stats = useMemo(() => {
    if (!classGrades.length) return { avg: "N/A", rank: "--", rankColor: "#6B7280" };

    let totalScore = 0;
    let totalMax = 0;
    classGrades.forEach(g => {
      totalScore += g.score;
      totalMax += g.maxScore;
    });

    let avg = 0;
    if (totalMax > 0) avg = (totalScore / totalMax) * 10;

    const avgStr = avg.toFixed(1);

    let rank = "Yếu";
    let rankColor = "#EF4444"; // Red

    if (avg >= 8) { rank = "Giỏi"; rankColor = "#10B981"; }
    else if (avg >= 6.5) { rank = "Khá"; rankColor = "#3B82F6"; }
    else if (avg >= 5) { rank = "Trung bình"; rankColor = "#F59E0B"; }

    return { avg: avgStr, rank, rankColor };
  }, [classGrades]);

  // Group by Category
  const groupedScores = useMemo(() => {
    const groups: Record<string, StudentGradeRecord[]> = {};
    classGrades.forEach(g => {
      const cat = g.gradingSheetId?.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(g);
    });
    return groups;
  }, [classGrades]);

  // Get recent feedback
  const feedbackList = useMemo(() => {
    return classGrades.filter(g => g.feedback).sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());
  }, [classGrades]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* Summary Card */}
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              style={styles.summaryCard}
            >
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Trung bình môn</Text>
                  <Text style={styles.summaryValue}>{stats.avg}</Text>
                </View>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankLabel}>Xếp loại</Text>
                  <View style={[styles.rankBadge, { borderColor: stats.rankColor }]}>
                    <Text style={styles.rankText}>{stats.rank}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Detailed Scores */}
            <Text style={styles.sectionTitle}>Bảng điểm chi tiết</Text>
            <View style={styles.detailCard}>

              {Object.keys(groupedScores).length > 0 ? Object.keys(groupedScores).map((cat, idx) => (
                <View key={cat}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>{CATEGORY_LABELS[cat] || cat}</Text>
                    <View style={styles.multiScore}>
                      {groupedScores[cat].map((g, i) => (
                        <Text key={i} style={styles.scoreTag}>{g.score}</Text>
                      ))}
                    </View>
                  </View>
                  {idx < Object.keys(groupedScores).length - 1 && <View style={styles.divider} />}
                </View>
              )) : <Text style={{ textAlign: 'center', color: '#6B7280', padding: 10 }}>Chưa có điểm số</Text>}

            </View>

            {/* Teacher Comments */}
            <Text style={styles.sectionTitle}>Nhận xét của giáo viên</Text>
            {feedbackList.length > 0 ? feedbackList.map((f, i) => (
              <View key={i} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.teacherAvatar}>
                    <Text style={styles.avatarText}>G</Text>
                  </View>
                  <View>
                    <Text style={styles.commentTeacher}>{f.gradedBy?.name || "Giáo viên"}</Text>
                    <Text style={styles.commentDate}>{new Date(f.gradedAt).toLocaleDateString('vi-VN')}</Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>
                  {f.feedback}
                </Text>
              </View>
            )) : (
              <View style={styles.commentCard}>
                <Text style={{ color: '#6B7280', textAlign: 'center' }}>Chưa có nhận xét nào.</Text>
              </View>
            )}
          </>
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
  summaryCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  rankContainer: {
    alignItems: "flex-end",
  },
  rankLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 6,
  },
  rankBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  rankText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  scoreLabel: {
    fontSize: 15,
    color: "#4B5563",
    flex: 1,
  },
  scoreNum: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  multiScore: {
    flexDirection: "row",
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
    marginLeft: 10
  },
  scoreTag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  commentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  commentTeacher: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
  },
  commentDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  commentContent: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
});
