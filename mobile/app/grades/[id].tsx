import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function GradeDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const subjectName = typeof name === 'string' ? name : "Chi tiết môn học";

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            style={styles.summaryCard}
        >
            <View style={styles.summaryRow}>
                <View>
                    <Text style={styles.summaryLabel}>Trung bình môn</Text>
                    <Text style={styles.summaryValue}>8.2</Text>
                </View>
                <View style={styles.rankContainer}>
                    <Text style={styles.rankLabel}>Xếp loại</Text>
                    <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>Giỏi</Text>
                    </View>
                </View>
            </View>
        </LinearGradient>

        {/* Detailed Scores */}
        <Text style={styles.sectionTitle}>Bảng điểm chi tiết</Text>
        <View style={styles.detailCard}>
            <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Điểm thi (Giữa kỳ)</Text>
                <Text style={styles.scoreNum}>8.5</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Điểm kiểm tra (15 phút)</Text>
                <View style={styles.multiScore}>
                    <Text style={styles.scoreTag}>9.0</Text>
                    <Text style={styles.scoreTag}>7.5</Text>
                    <Text style={styles.scoreTag}>8.0</Text>
                </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Điểm miệng</Text>
                <View style={styles.multiScore}>
                    <Text style={styles.scoreTag}>10</Text>
                    <Text style={styles.scoreTag}>9.0</Text>
                </View>
            </View>
             <View style={styles.divider} />
             <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { fontWeight: 'bold', color: '#1F2937' }]}>Điểm thi (Cuối kỳ)</Text>
                <Text style={[styles.scoreNum, { color: '#2563EB' }]}>--</Text>
            </View>
        </View>

        {/* Teacher Comments */}
        <Text style={styles.sectionTitle}>Nhận xét của giáo viên</Text>
        <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
                <View style={styles.teacherAvatar}>
                    <Text style={styles.avatarText}>C</Text>
                </View>
                <View>
                    <Text style={styles.commentTeacher}>Cô Trần Thị B</Text>
                    <Text style={styles.commentDate}>20/01/2025</Text>
                </View>
            </View>
            <Text style={styles.commentContent}>
                Em học tập rất chăm chỉ, tiếp thu bài nhanh. Tuy nhiên cần cẩn thận hơn trong các bài kiểm tra 15 phút để tránh sai sót nhỏ. Cố gắng phát huy nhé!
            </Text>
        </View>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  summaryLabel: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
      marginBottom: 4,
  },
  summaryValue: {
      fontSize: 42,
      fontWeight: 'bold',
      color: "#FFFFFF",
  },
  rankContainer: {
      alignItems: 'flex-end',
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
      fontWeight: 'bold',
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
  },
  scoreLabel: {
      fontSize: 15,
      color: "#4B5563",
      flex: 1,
  },
  scoreNum: {
      fontSize: 16,
      fontWeight: 'bold',
      color: "#1F2937",
  },
  multiScore: {
      flexDirection: 'row',
      gap: 8,
  },
  scoreTag: {
      fontSize: 14,
      fontWeight: '600',
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
      marginBottom: 40,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
  },
  commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
  },
  teacherAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#EFF6FF",
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: "#3B82F6",
  },
  commentTeacher: {
      fontSize: 15,
      fontWeight: 'bold',
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
  }
});
