import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

// Mock enrolled subjects
const subjects = [
  { id: "1", name: "Toán", teacher: "Cô Trần Thị B", avgScore: 8.2, trend: "up" },
  { id: "2", name: "Vật lý", teacher: "Thầy Nguyễn Văn F", avgScore: 7.8, trend: "down" },
  { id: "3", name: "Hóa học", teacher: "Cô Lê Thị H", avgScore: 8.5, trend: "same" },
  { id: "4", name: "Sinh học", teacher: "Thầy Phạm Văn K", avgScore: 9.0, trend: "up" },
  { id: "5", name: "Anh văn", teacher: "Thầy Lê Văn E", avgScore: 8.8, trend: "up" },
];

export default function GradesListScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả học tập</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Danh sách môn học</Text>
        <Text style={styles.sectionSubtitle}>Chọn môn học để xem chi tiết điểm số và nhận xét</Text>

        {subjects.map((sub, index) => (
          <TouchableOpacity 
            key={sub.id} 
            style={styles.subjectCard}
            onPress={() => router.push(`/grades/${sub.id}?name=${encodeURIComponent(sub.name)}`)}
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
                <Text style={[
                    styles.scoreValue, 
                    sub.avgScore >= 8 ? { color: "#10B981" } : 
                    sub.avgScore >= 6.5 ? { color: "#3B82F6" } : 
                    { color: "#F59E0B" }
                ]}>
                    {sub.avgScore}
                </Text>
                {sub.trend === 'up' && <Ionicons name="trending-up" size={16} color="#10B981" />}
                {sub.trend === 'down' && <Ionicons name="trending-down" size={16} color="#EF4444" />}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
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
      fontWeight: 'bold',
      color: "#1F2937",
      marginBottom: 4,
  },
  sectionSubtitle: {
      fontSize: 14,
      color: "#6B7280",
      marginBottom: 20,
  },
  subjectCard: {
      flexDirection: 'row',
      alignItems: 'center',
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
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  subjectIconText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: "#3B82F6",
  },
  subjectInfo: {
      flex: 1,
  },
  subjectName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: "#1F2937",
      marginBottom: 2,
  },
  teacherName: {
      fontSize: 13,
      color: "#6B7280",
  },
  scoreContainer: {
      alignItems: 'flex-end',
      marginRight: 12,
  },
  scoreValue: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 2,
  }
});
