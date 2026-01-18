import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type RankingCategory = "score" | "attendance" | "diligence";

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
  diligence: {
    label: "Chăm chỉ",
    desc: "Hoàn thành bài tập",
    icon: "book",
    color: "#3B82F6",
  },
};

const leaderboardData: Record<
  RankingCategory,
  {
    rank: number;
    name: string;
    className: string;
    metric: string;
    detail: string;
    avatar: string;
  }[]
> = {
  score: [
    {
      rank: 1,
      name: "Nguyễn Văn A",
      className: "Lớp Toán 12A1",
      metric: "9.8",
      detail: "Top Điểm",
      avatar: "👨‍🎓",
    },
    {
      rank: 2,
      name: "Trần Thị B",
      className: "Lớp Anh Văn 12B2",
      metric: "9.6",
      detail: "Top Điểm",
      avatar: "👩‍🎓",
    },
    {
      rank: 3,
      name: "Lê Văn C",
      className: "Lớp Vật Lý 11C1",
      metric: "9.5",
      detail: "Top Điểm",
      avatar: "👨‍🎓",
    },
    {
      rank: 4,
      name: "Phạm Minh D",
      className: "Lớp Hóa Học 10A2",
      metric: "9.2",
      detail: "Top Điểm",
      avatar: "👨‍🎓",
    },
    {
      rank: 5,
      name: "Hoàng An E",
      className: "Lớp Toán 11B1",
      metric: "9.0",
      detail: "Top Điểm",
      avatar: "👩‍🎓",
    },
  ],
  attendance: [
    {
      rank: 1,
      name: "Trần Minh T",
      className: "Đã theo học 240 ngày",
      metric: "100%",
      detail: "Chuyên cần",
      avatar: "👨‍🎓",
    },
    {
      rank: 2,
      name: "Lê Hải Y",
      className: "Đã theo học 210 ngày",
      metric: "100%",
      detail: "Chuyên cần",
      avatar: "👩‍🎓",
    },
    {
      rank: 3,
      name: "Nguyễn Công P",
      className: "Đã theo học 180 ngày",
      metric: "98%",
      detail: "Nghỉ 1 buổi có phép",
      avatar: "👨‍🎓",
    },
    {
      rank: 4,
      name: "Đặng Thu H",
      className: "Đã theo học 150 ngày",
      metric: "97%",
      detail: "Nghỉ 1 buổi",
      avatar: "👩‍🎓",
    },
    {
      rank: 5,
      name: "Võ Minh K",
      className: "Đã theo học 120 ngày",
      metric: "96%",
      detail: "Nghỉ 2 buổi có phép",
      avatar: "👨‍🎓",
    },
  ],
  diligence: [
    {
      rank: 1,
      name: "Phạm Thị L",
      className: "Hoàn thành 100% bài tập",
      metric: "100%",
      detail: "Xuất sắc",
      avatar: "👩‍🎓",
    },
    {
      rank: 2,
      name: "Trần Văn M",
      className: "Hoàn thành 98% bài tập",
      metric: "98%",
      detail: "Giỏi",
      avatar: "👨‍🎓",
    },
    {
      rank: 3,
      name: "Lê Thị N",
      className: "Hoàn thành 95% bài tập",
      metric: "95%",
      detail: "Giỏi",
      avatar: "👩‍🎓",
    },
    {
      rank: 4,
      name: "Nguyễn Văn O",
      className: "Hoàn thành 93% bài tập",
      metric: "93%",
      detail: "Khá",
      avatar: "👨‍🎓",
    },
    {
      rank: 5,
      name: "Hoàng Minh P",
      className: "Hoàn thành 90% bài tập",
      metric: "90%",
      detail: "Khá",
      avatar: "👨‍🎓",
    },
  ],
};

const rankColors = {
  1: ["#FFD700", "#FFC107"],
  2: ["#C0C0C0", "#9E9E9E"],
  3: ["#CD7F32", "#A0522D"],
};

export default function LeaderboardScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<RankingCategory>("score");

  const onRefresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

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

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
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

        {/* Top 3 Podium */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top 3 xuất sắc</Text>
          <View style={styles.podiumContainer}>
            {/* 2nd Place */}
            <View style={styles.podiumItem}>
              <View style={styles.podiumAvatarContainer}>
                <Text style={styles.podiumAvatar}>
                  {leaderboardData[selectedCategory][1]?.avatar || "👨‍🎓"}
                </Text>
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
                {leaderboardData[selectedCategory][1]?.name || "-"}
              </Text>
              <Text style={styles.podiumMetric}>
                {leaderboardData[selectedCategory][1]?.metric || "-"}
              </Text>
              <View style={[styles.podiumBase, styles.podiumBase2]} />
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumItem, styles.podiumItemFirst]}>
              <View style={styles.crownIcon}>
                <Text style={{ fontSize: 24 }}>👑</Text>
              </View>
              <View style={styles.podiumAvatarContainer}>
                <Text style={styles.podiumAvatarFirst}>
                  {leaderboardData[selectedCategory][0]?.avatar || "👨‍🎓"}
                </Text>
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
                {leaderboardData[selectedCategory][0]?.name || "-"}
              </Text>
              <Text style={styles.podiumMetricFirst}>
                {leaderboardData[selectedCategory][0]?.metric || "-"}
              </Text>
              <View style={[styles.podiumBase, styles.podiumBase1]} />
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumItem}>
              <View style={styles.podiumAvatarContainer}>
                <Text style={styles.podiumAvatar}>
                  {leaderboardData[selectedCategory][2]?.avatar || "👨‍🎓"}
                </Text>
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
                {leaderboardData[selectedCategory][2]?.name || "-"}
              </Text>
              <Text style={styles.podiumMetric}>
                {leaderboardData[selectedCategory][2]?.metric || "-"}
              </Text>
              <View style={[styles.podiumBase, styles.podiumBase3]} />
            </View>
          </View>
        </View>

        {/* Full Ranking List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Bảng xếp hạng đầy đủ</Text>
          <View style={styles.rankingList}>
            {leaderboardData[selectedCategory].map((item, index) => (
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
                  <Text style={styles.rankAvatar}>{item.avatar}</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{item.name}</Text>
                  <Text style={styles.rankClass}>{item.className}</Text>
                </View>
                <View style={styles.rankMetricContainer}>
                  <Text
                    style={[
                      styles.rankMetric,
                      { color: leaderboardOptions[selectedCategory].color },
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

        {/* Stats Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Thống kê</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                style={styles.statCardGradient}
              >
                <Ionicons name="people" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>248</Text>
                <Text style={styles.statLabel}>Học sinh</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.statCardGradient}
              >
                <Ionicons name="star" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>8.5</Text>
                <Text style={styles.statLabel}>Điểm TB</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#3B82F6", "#2563EB"]}
                style={styles.statCardGradient}
              >
                <Ionicons name="checkbox" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>95%</Text>
                <Text style={styles.statLabel}>Chuyên cần</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                style={styles.statCardGradient}
              >
                <Ionicons name="book" size={24} color="#FFFFFF" />
                <Text style={styles.statValue}>92%</Text>
                <Text style={styles.statLabel}>Bài tập</Text>
              </LinearGradient>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
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
    width: 120,
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
  },
  podiumAvatar: {
    fontSize: 36,
  },
  podiumAvatarFirst: {
    fontSize: 44,
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
  },
  podiumNameFirst: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 8,
    maxWidth: 100,
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
  rankAvatar: {
    fontSize: 28,
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
});
