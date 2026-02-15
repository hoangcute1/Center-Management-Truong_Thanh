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
import { useState, useEffect, useCallback } from "react";
import { useAuthStore, useLeaderboardStore } from "@/lib/stores";

const leaderboardTypes = [
  { id: "score", label: "Top điểm", icon: "📊" },
  { id: "attendance", label: "Chuyên cần", icon: "📅" },
];

type LeaderboardType = "score" | "attendance";

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("score");
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuthStore();
  const { leaderboard, myRank, loading, fetchLeaderboard, fetchTeacherLeaderboard, fetchMyRank } =
    useLeaderboardStore();

  // Fetch leaderboard data on mount
  useEffect(() => {
    if (user?.role === "teacher") {
      fetchTeacherLeaderboard({ limit: 20 });
    } else {
      fetchLeaderboard({ limit: 20 });
    }
    if (user?.role === "student") {
      fetchMyRank();
    }
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.role === "teacher") {
      await fetchTeacherLeaderboard({ limit: 20 });
    } else {
      await fetchLeaderboard({ limit: 20 });
    }
    if (user?.role === "student") {
      await fetchMyRank();
    }
    setRefreshing(false);
  }, [fetchLeaderboard, fetchTeacherLeaderboard, fetchMyRank, user?.role]);

  // Get current leaderboard data based on active tab
  const currentScoreData = leaderboard?.score || [];
  const currentAttendanceData = leaderboard?.attendance || [];

  // Find current user's rank
  const getMyRankForTab = () => {
    if (!myRank) return null;
    if (activeTab === "score") {
      return myRank.scoreRank;
    }
    return myRank.attendanceRank;
  };

  const myCurrentRank = getMyRankForTab();

  // Render loading state
  if (loading && !leaderboard) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bảng xếp hạng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải bảng xếp hạng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render score item for podium
  const renderScorePodiumItem = (
    item: (typeof currentScoreData)[0],
    position: 1 | 2 | 3
  ) => {
    const isFirst = position === 1;
    const avatarSize = isFirst ? 80 : 64;
    const borderColor =
      position === 1 ? "#F59E0B" : position === 2 ? "#E5E7EB" : "#FEE2E2";
    const badgeColor =
      position === 1 ? "#F59E0B" : position === 2 ? "#E5E7EB" : "#FCA5A5";

    return (
      <View
        style={[
          styles.podiumItem,
          !isFirst && { marginTop: 40 },
          isFirst && { zIndex: 10 },
        ]}
      >
        <View style={styles.podiumAvatarContainer}>
          <View
            style={[
              styles.podiumAvatar,
              { borderColor, width: avatarSize, height: avatarSize },
            ]}
          >
            <Text style={[styles.avatarText, isFirst && { fontSize: 24 }]}>
              {item.studentName?.charAt(0) || "?"}
            </Text>
          </View>
          <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
            {isFirst ? (
              <Ionicons name="trophy" size={14} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.rankText,
                  position === 3 && { color: "#7F1D1D" },
                ]}
              >
                {position}
              </Text>
            )}
          </View>
        </View>
        <Text
          style={[
            styles.podiumName,
            isFirst && { fontWeight: "bold", fontSize: 16 },
          ]}
          numberOfLines={1}
        >
          {item.studentName}
        </Text>
        <Text
          style={[
            styles.podiumScore,
            isFirst && { fontSize: 18, color: "#D97706" },
          ]}
        >
          {item.averageScore?.toFixed(1)} điểm
        </Text>
        <Text style={styles.podiumDetail}>{item.totalGrades} bài KT</Text>
      </View>
    );
  };

  // Render attendance item for podium
  const renderAttendancePodiumItem = (
    item: (typeof currentAttendanceData)[0],
    position: 1 | 2 | 3
  ) => {
    const isFirst = position === 1;
    const avatarSize = isFirst ? 80 : 64;
    const borderColor =
      position === 1 ? "#10B981" : position === 2 ? "#E5E7EB" : "#FEE2E2";
    const badgeColor =
      position === 1 ? "#10B981" : position === 2 ? "#E5E7EB" : "#FCA5A5";

    return (
      <View
        style={[
          styles.podiumItem,
          !isFirst && { marginTop: 40 },
          isFirst && { zIndex: 10 },
        ]}
      >
        <View style={styles.podiumAvatarContainer}>
          <View
            style={[
              styles.podiumAvatar,
              { borderColor, width: avatarSize, height: avatarSize },
            ]}
          >
            <Text style={[styles.avatarText, isFirst && { fontSize: 24 }]}>
              {item.studentName?.charAt(0) || "?"}
            </Text>
          </View>
          <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
            {isFirst ? (
              <Ionicons name="trophy" size={14} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.rankText,
                  position === 3 && { color: "#7F1D1D" },
                ]}
              >
                {position}
              </Text>
            )}
          </View>
        </View>
        <Text
          style={[
            styles.podiumName,
            isFirst && { fontWeight: "bold", fontSize: 16 },
          ]}
          numberOfLines={1}
        >
          {item.studentName}
        </Text>
        <Text
          style={[
            styles.podiumScore,
            { color: "#10B981" },
            isFirst && { fontSize: 18 },
          ]}
        >
          {item.attendanceRate?.toFixed(1)}%
        </Text>
        <Text style={styles.podiumDetail}>
          {item.presentCount}/{item.totalSessions} buổi
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Bảng xếp hạng</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {leaderboardTypes.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab.id as LeaderboardType)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
      >
        {activeTab === "score" ? (
          // SCORE LEADERBOARD
          <>
            {currentScoreData.length >= 3 ? (
              <View style={styles.podiumContainer}>
                {/* Rank 2 */}
                {renderScorePodiumItem(currentScoreData[1], 2)}
                {/* Rank 1 */}
                {renderScorePodiumItem(currentScoreData[0], 1)}
                {/* Rank 3 */}
                {renderScorePodiumItem(currentScoreData[2], 3)}
              </View>
            ) : currentScoreData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>Chưa có dữ liệu xếp hạng</Text>
              </View>
            ) : null}

            {/* List remaining */}
            <View style={styles.listContainer}>
              {currentScoreData.slice(3).map((item) => (
                <View
                  key={item.studentId}
                  style={[
                    styles.listItem,
                    user?._id === item.studentId && styles.listItemHighlight,
                  ]}
                >
                  <Text style={styles.listRank}>{item.rank}</Text>
                  <View style={styles.listAvatar}>
                    <Text style={styles.listAvatarText}>
                      {item.studentName?.charAt(0) || "?"}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{item.studentName}</Text>
                    <Text style={styles.listSubtext}>
                      {item.totalGrades} bài kiểm tra
                    </Text>
                  </View>
                  <View style={styles.listScoreContainer}>
                    <Text style={styles.listScore}>
                      {item.averageScore?.toFixed(1)}
                    </Text>
                    <Text style={styles.listScoreLabel}>điểm</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          // ATTENDANCE LEADERBOARD
          <>
            {currentAttendanceData.length >= 3 ? (
              <View style={styles.podiumContainer}>
                {/* Rank 2 */}
                {renderAttendancePodiumItem(currentAttendanceData[1], 2)}
                {/* Rank 1 */}
                {renderAttendancePodiumItem(currentAttendanceData[0], 1)}
                {/* Rank 3 */}
                {renderAttendancePodiumItem(currentAttendanceData[2], 3)}
              </View>
            ) : currentAttendanceData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  Chưa có dữ liệu chuyên cần
                </Text>
              </View>
            ) : null}

            {/* List remaining */}
            <View style={styles.listContainer}>
              {currentAttendanceData.slice(3).map((item) => (
                <View
                  key={item.studentId}
                  style={[
                    styles.listItem,
                    user?._id === item.studentId && styles.listItemHighlight,
                  ]}
                >
                  <Text style={styles.listRank}>{item.rank}</Text>
                  <View style={[styles.listAvatar, { backgroundColor: "#D1FAE5" }]}>
                    <Text style={[styles.listAvatarText, { color: "#10B981" }]}>
                      {item.studentName?.charAt(0) || "?"}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{item.studentName}</Text>
                    <Text style={styles.listSubtext}>
                      {item.presentCount}/{item.totalSessions} buổi
                    </Text>
                  </View>
                  <View style={styles.listScoreContainer}>
                    <Text style={[styles.listScore, { color: "#10B981" }]}>
                      {item.attendanceRate?.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* My Rank Footer - Only show for students */}
      {user?.role === "student" && myCurrentRank && (
        <View style={styles.myRankFooter}>
          <View style={styles.myRankContainer}>
            <Text style={styles.myRankLabel}>Hạng của bạn:</Text>
            <View style={styles.myRankInfo}>
              <View
                style={[
                  styles.myRankBadge,
                  activeTab === "attendance" && { backgroundColor: "#10B981" },
                ]}
              >
                <Text style={styles.myRankText}>#{myCurrentRank}</Text>
              </View>
              <Text style={styles.myRankTotal}>
                / {myRank?.totalStudents || 0} học sinh
              </Text>
            </View>
          </View>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  tabContainer: {
    flexDirection: "row",
    padding: 4,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#3B82F6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  podiumItem: {
    alignItems: "center",
    width: 100,
  },
  podiumAvatarContainer: {
    marginBottom: 12,
    position: "relative",
    alignItems: "center",
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B5563",
  },
  rankBadge: {
    position: "absolute",
    bottom: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
  },
  podiumName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
    width: "100%",
  },
  podiumScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  podiumDetail: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  listItemHighlight: {
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  listRank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B7280",
    width: 30,
    textAlign: "center",
    marginRight: 12,
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  listSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  listScoreContainer: {
    alignItems: "flex-end",
  },
  listScore: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  listScoreLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  myRankFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  myRankContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  myRankLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
  },
  myRankInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  myRankBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  myRankText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  myRankTotal: {
    fontSize: 14,
    color: "#6B7280",
  },
});
