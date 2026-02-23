import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLeaderboardStore } from "@/lib/stores";
import { useBranchesStore } from "@/lib/stores";

const { width } = Dimensions.get("window");

type RankingCategory = "score" | "attendance";

const leaderboardOptions: Record<
  RankingCategory,
  { label: string; desc: string; icon: string; color: string }
> = {
  score: {
    label: "Top điểm",
    desc: "Điểm trung bình cao",
    icon: "trophy",
    color: "#F59E0B",
  },
  attendance: {
    label: "Chuyên cần",
    desc: "Đi học đầy đủ",
    icon: "checkbox",
    color: "#10B981",
  },
};

const rankColors = {
  1: ["#FFD700", "#FFC107"],
  2: ["#C0C0C0", "#9E9E9E"],
  3: ["#CD7F32", "#A0522D"],
};

export default function LeaderboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<RankingCategory>("score");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [showBranchPicker, setShowBranchPicker] = useState(false);

  const { leaderboard, loading, fetchLeaderboard } = useLeaderboardStore();
  const { branches, fetchBranches } = useBranchesStore();

  useEffect(() => {
    fetchBranches();
    fetchLeaderboard({ limit: 20 });
  }, []);

  useEffect(() => {
    const params: { branchId?: string; limit: number } = { limit: 20 };
    if (selectedBranch) {
      params.branchId = selectedBranch;
    }
    fetchLeaderboard(params);
  }, [selectedBranch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const params: { branchId?: string; limit: number } = { limit: 20 };
    if (selectedBranch) {
      params.branchId = selectedBranch;
    }
    await fetchLeaderboard(params);
    setRefreshing(false);
  }, [fetchLeaderboard, selectedBranch]);

  const selectedBranchName = selectedBranch
    ? branches.find((b) => b._id === selectedBranch)?.name || "Cơ sở"
    : "Tất cả cơ sở";

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankStyle = (rank: number) => {
    if (rank <= 3) {
      return {
        borderColor: rankColors[rank as 1 | 2 | 3][0],
        borderWidth: 2,
      };
    }
    return {};
  };

  const currentScoreData = leaderboard?.score || [];
  const currentAttendanceData = leaderboard?.attendance || [];
  const summary = leaderboard?.summary;

  // Get data for selected category
  const getCurrentData = () => {
    if (selectedCategory === "score") {
      return currentScoreData.map((item) => ({
        rank: item.rank,
        name: item.studentName,
        className: item.className || `${item.totalGrades} bài kiểm tra`,
        metric: item.averageScore.toFixed(1),
        detail: "Top Điểm",
        avatar: item.studentName?.charAt(0) || "?",
      }));
    }
    return currentAttendanceData.map((item) => ({
      rank: item.rank,
      name: item.studentName,
      className: `${item.presentCount}/${item.totalSessions} buổi`,
      metric: `${item.attendanceRate}%`,
      detail: `Theo học ${item.daysEnrolled} ngày`,
      avatar: item.studentName?.charAt(0) || "?",
    }));
  };

  const displayData = getCurrentData();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Branch Picker Modal - outside ScrollView for proper rendering */}
      <Modal visible={showBranchPicker} transparent animationType="fade" onRequestClose={() => setShowBranchPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowBranchPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Chọn cơ sở</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[styles.pickerOption, !selectedBranch && styles.pickerOptionActive]}
                onPress={() => { setSelectedBranch(""); setShowBranchPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, !selectedBranch && styles.pickerOptionTextActive]}>
                  🏢 Tất cả cơ sở
                </Text>
                {!selectedBranch && <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />}
              </TouchableOpacity>
              {branches.map((branch) => (
                <TouchableOpacity
                  key={branch._id}
                  style={[styles.pickerOption, selectedBranch === branch._id && styles.pickerOptionActive]}
                  onPress={() => { setSelectedBranch(branch._id); setShowBranchPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, selectedBranch === branch._id && styles.pickerOptionTextActive]}>
                    📍 {branch.name}
                  </Text>
                  {selectedBranch === branch._id && <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="trophy" size={28} color="#FFFFFF" />
            <View style={styles.headerInfo}>
              <Text style={styles.headerValue}>Bảng xếp hạng</Text>
              <Text style={styles.headerSubtitle}>
                Tôn vinh học sinh xuất sắc
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Branch Picker */}
        <View style={styles.branchPickerSection}>
          <TouchableOpacity
            style={styles.branchPickerTrigger}
            onPress={() => setShowBranchPicker(true)}
          >
            <Ionicons name="business" size={18} color="#F59E0B" />
            <Text style={styles.branchPickerText} numberOfLines={1}>{selectedBranchName}</Text>
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Category Selector */}
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {(Object.keys(leaderboardOptions) as RankingCategory[]).map(
              (category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category && styles.categoryCardActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          selectedCategory === category
                            ? leaderboardOptions[category].color
                            : `${leaderboardOptions[category].color}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={leaderboardOptions[category].icon as any}
                      size={20}
                      color={
                        selectedCategory === category
                          ? "#FFFFFF"
                          : leaderboardOptions[category].color
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === category &&
                        styles.categoryLabelActive,
                    ]}
                  >
                    {leaderboardOptions[category].label}
                  </Text>
                  <Text style={styles.categoryDesc}>
                    {leaderboardOptions[category].desc}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
        </View>

        {/* Loading */}
        {loading && !leaderboard && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Đang tải bảng xếp hạng...</Text>
          </View>
        )}

        {/* Top 3 Podium */}
        {displayData.length >= 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top 3 xuất sắc</Text>
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              <View style={styles.podiumItem}>
                <View style={styles.podiumAvatarContainer}>
                  <View
                    style={[
                      styles.podiumAvatarCircle,
                      { borderColor: "#C0C0C0" },
                    ]}
                  >
                    <Text style={styles.podiumAvatarText}>
                      {displayData[1]?.avatar || "?"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.podiumRankBadge,
                      { backgroundColor: "#C0C0C0" },
                    ]}
                  >
                    <Text style={styles.podiumRankText}>2</Text>
                  </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {displayData[1]?.name || "-"}
                </Text>
                <Text style={styles.podiumMetric}>
                  {displayData[1]?.metric || "-"}
                </Text>
                <View style={[styles.podiumBase, styles.podiumBase2]} />
              </View>

              {/* 1st Place */}
              <View style={[styles.podiumItem, styles.podiumItemFirst]}>
                <View style={styles.crownIcon}>
                  <Text style={{ fontSize: 24 }}>👑</Text>
                </View>
                <View style={styles.podiumAvatarContainer}>
                  <View
                    style={[
                      styles.podiumAvatarCircle,
                      styles.podiumAvatarCircleFirst,
                      { borderColor: "#FFD700" },
                    ]}
                  >
                    <Text style={styles.podiumAvatarTextFirst}>
                      {displayData[0]?.avatar || "?"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.podiumRankBadge,
                      { backgroundColor: "#FFD700" },
                    ]}
                  >
                    <Text style={styles.podiumRankText}>1</Text>
                  </View>
                </View>
                <Text style={styles.podiumNameFirst} numberOfLines={1}>
                  {displayData[0]?.name || "-"}
                </Text>
                <Text style={styles.podiumMetricFirst}>
                  {displayData[0]?.metric || "-"}
                </Text>
                <View style={[styles.podiumBase, styles.podiumBase1]} />
              </View>

              {/* 3rd Place */}
              <View style={styles.podiumItem}>
                <View style={styles.podiumAvatarContainer}>
                  <View
                    style={[
                      styles.podiumAvatarCircle,
                      { borderColor: "#CD7F32" },
                    ]}
                  >
                    <Text style={styles.podiumAvatarText}>
                      {displayData[2]?.avatar || "?"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.podiumRankBadge,
                      { backgroundColor: "#CD7F32" },
                    ]}
                  >
                    <Text style={styles.podiumRankText}>3</Text>
                  </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {displayData[2]?.name || "-"}
                </Text>
                <Text style={styles.podiumMetric}>
                  {displayData[2]?.metric || "-"}
                </Text>
                <View style={[styles.podiumBase, styles.podiumBase3]} />
              </View>
            </View>
          </View>
        )}

        {/* Empty state */}
        {!loading && displayData.length === 0 && (
          <View style={styles.section}>
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có dữ liệu xếp hạng</Text>
              <Text style={styles.emptySubtext}>
                Dữ liệu sẽ xuất hiện khi có điểm số và điểm danh
              </Text>
            </View>
          </View>
        )}

        {/* Full Ranking List */}
        {displayData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Bảng xếp hạng đầy đủ</Text>
            <View style={styles.rankingList}>
              {displayData.map((item, index) => (
                <View
                  key={index}
                  style={[styles.rankingItem, getRankStyle(item.rank)]}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>
                      {getRankBadge(item.rank)}
                    </Text>
                  </View>
                  <View style={styles.rankAvatarContainer}>
                    <View
                      style={[
                        styles.rankAvatarCircle,
                        {
                          backgroundColor:
                            selectedCategory === "score"
                              ? "#FEF3C7"
                              : "#D1FAE5",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankAvatarText,
                          {
                            color:
                              selectedCategory === "score"
                                ? "#D97706"
                                : "#10B981",
                          },
                        ]}
                      >
                        {item.avatar}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName}>{item.name}</Text>
                    <Text style={styles.rankClass}>{item.className}</Text>
                  </View>
                  <View style={styles.rankMetricContainer}>
                    <Text
                      style={[
                        styles.rankMetric,
                        {
                          color: leaderboardOptions[selectedCategory].color,
                        },
                      ]}
                    >
                      {item.metric}
                    </Text>
                    <Text style={styles.rankDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stats Summary */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Thống kê</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={styles.statCardGradient}
                >
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>
                    {summary.totalStudents}
                  </Text>
                  <Text style={styles.statLabel}>Học sinh</Text>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.statCardGradient}
                >
                  <Ionicons name="star" size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>
                    {summary.averageScore > 0 ? summary.averageScore.toFixed(1) : "—"}
                  </Text>
                  <Text style={styles.statLabel}>Điểm TB</Text>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  style={styles.statCardGradient}
                >
                  <Ionicons name="checkbox" size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>
                    {summary.averageAttendanceRate > 0 ? `${summary.averageAttendanceRate}%` : "—"}
                  </Text>
                  <Text style={styles.statLabel}>Chuyên cần</Text>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  style={styles.statCardGradient}
                >
                  <Ionicons name="podium" size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>
                    {currentScoreData.length}
                  </Text>
                  <Text style={styles.statLabel}>Có xếp hạng</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 13,
    color: "#D1D5DB",
  },
  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  // Category
  categoryContainer: {
    paddingHorizontal: 0,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: 140,
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardActive: {
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  categoryLabelActive: {
    color: "#F59E0B",
  },
  categoryDesc: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  // Podium
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 8,
  },
  podiumItem: {
    alignItems: "center",
    width: (width - 64) / 3,
  },
  podiumItemFirst: {
    marginBottom: 20,
  },
  crownIcon: {
    marginBottom: 4,
  },
  podiumAvatarContainer: {
    position: "relative",
    alignItems: "center",
  },
  podiumAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  podiumAvatarCircleFirst: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4B5563",
  },
  podiumAvatarTextFirst: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4B5563",
  },
  podiumRankBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  podiumRankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 8,
    maxWidth: 80,
    textAlign: "center",
  },
  podiumNameFirst: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 8,
    maxWidth: 100,
    textAlign: "center",
  },
  podiumMetric: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F59E0B",
    marginTop: 4,
  },
  podiumMetricFirst: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F59E0B",
    marginTop: 4,
  },
  podiumBase: {
    width: "80%",
    borderRadius: 8,
    marginTop: 8,
  },
  podiumBase1: {
    height: 60,
    backgroundColor: "#FFD700",
  },
  podiumBase2: {
    height: 40,
    backgroundColor: "#C0C0C0",
  },
  podiumBase3: {
    height: 30,
    backgroundColor: "#CD7F32",
  },
  // Ranking List
  rankingList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rankBadge: {
    width: 32,
    alignItems: "center",
  },
  rankBadgeText: {
    fontSize: 16,
  },
  rankAvatarContainer: {
    marginRight: 12,
  },
  rankAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rankAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  rankClass: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  rankMetricContainer: {
    alignItems: "flex-end",
  },
  rankMetric: {
    fontSize: 18,
    fontWeight: "700",
  },
  rankDetail: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  statCard: {
    width: (width - 44) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardGradient: {
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  // Branch Picker
  branchPickerSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  branchPickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  branchPickerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerContainer: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerOptionActive: {
    backgroundColor: "#FFFBEB",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  pickerOptionTextActive: {
    color: "#D97706",
    fontWeight: "700",
  },
});
