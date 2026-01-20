import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const leaderboardTypes = [
  { id: 'score', label: 'Học tập' },
  { id: 'attendance', label: 'Chuyên cần' },
  { id: 'activity', label: 'Chăm chỉ' },
];

// Mock data extension
const mockData = {
  score: [
    { rank: 1, name: "Nguyen Van A", score: 9.8, avatar: "A", detail: "9.8 điểm" },
    { rank: 2, name: "Tran Thi B", score: 9.6, avatar: "B", detail: "9.6 điểm" },
    { rank: 3, name: "Le Van C", score: 9.5, avatar: "C", detail: "9.5 điểm" },
    { rank: 4, name: "Pham Van D", score: 9.2, avatar: "D", detail: "9.2 điểm" },
    { rank: 5, name: "Hoang Thi E", score: 9.0, avatar: "E", detail: "9.0 điểm" },
    { rank: 6, name: "Vu Van F", score: 8.9, avatar: "F", detail: "8.9 điểm" },
    { rank: 7, name: "Dang Tuan G", score: 8.8, avatar: "G", detail: "8.8 điểm" },
  ],
  attendance: [
    { rank: 1, name: "Hoang Thi E", score: 100, avatar: "E", detail: "100% có mặt" },
    { rank: 2, name: "Nguyen Van A", score: 98, avatar: "A", detail: "98% có mặt" },
    { rank: 3, name: "Tran Thi B", score: 95, avatar: "B", detail: "95% có mặt" },
    { rank: 4, name: "Le Van C", score: 92, avatar: "C", detail: "92% có mặt" },
    { rank: 5, name: "Pham Van D", score: 90, avatar: "D", detail: "90% có mặt" },
    { rank: 6, name: "Vu Van F", score: 88, avatar: "F", detail: "88% có mặt" },
    { rank: 7, name: "Dang Tuan G", score: 85, avatar: "G", detail: "85% có mặt" },
  ],
  activity: [
    { rank: 1, name: "Le Van C", score: 45, avatar: "C", detail: "45 hoạt động" },
    { rank: 2, name: "Pham Van D", score: 42, avatar: "D", detail: "42 hoạt động" },
    { rank: 3, name: "Hoang Thi E", score: 40, avatar: "E", detail: "40 hoạt động" },
    { rank: 4, name: "Nguyen Van A", score: 38, avatar: "A", detail: "38 hoạt động" },
    { rank: 5, name: "Tran Thi B", score: 35, avatar: "B", detail: "35 hoạt động" },
    { rank: 6, name: "Vu Van F", score: 30, avatar: "F", detail: "30 hoạt động" },
    { rank: 7, name: "Dang Tuan G", score: 28, avatar: "G", detail: "28 hoạt động" },
  ],
};

import { useState } from "react";
// Import auth store to identify current user
import { useAuthStore } from "@/lib/stores";

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<'score'|'attendance'|'activity'>('score');
  const { user } = useAuthStore();
  
  const currentData = mockData[activeTab];
  
  // Find current user rank (mocking by name match or random if not found)
  const myRank = currentData.find(item => item.name === user?.name) || 
                 { rank: 12, name: user?.name || "Tôi", score: 0, avatar: "Me", detail: "---" };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảng xếp hạng</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {leaderboardTypes.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Top 3 Podium */}
          <View style={styles.podiumContainer}>
              {/* Rank 2 */}
              <View style={[styles.podiumItem, { marginTop: 40 }]}>
                    <View style={styles.podiumAvatarContainer}>
                        <View style={[styles.podiumAvatar, { borderColor: "#E5E7EB" }]}>
                             <Text style={styles.avatarText}>{currentData[1].avatar}</Text>
                        </View>
                        <View style={[styles.rankBadge, { backgroundColor: "#E5E7EB" }]}>
                             <Text style={styles.rankText}>2</Text>
                        </View>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{currentData[1].name}</Text>
                    <Text style={styles.podiumScore}>{currentData[1].detail}</Text>
              </View>

              {/* Rank 1 */}
              <View style={[styles.podiumItem, { zIndex: 10 }]}>
                    <View style={styles.podiumAvatarContainer}>
                         <View style={[styles.podiumAvatar, { borderColor: "#F59E0B", width: 80, height: 80 }]}>
                             <Text style={[styles.avatarText, { fontSize: 24 }]}>{currentData[0].avatar}</Text>
                        </View>
                        <View style={[styles.rankBadge, { backgroundColor: "#F59E0B", bottom: -12 }]}>
                             <Ionicons name="trophy" size={14} color="#FFFFFF" />
                        </View>
                    </View>
                    <Text style={[styles.podiumName, { fontWeight: "bold", fontSize: 16 }]} numberOfLines={1}>{currentData[0].name}</Text>
                    <Text style={[styles.podiumScore, { fontSize: 18, color: "#D97706" }]}>{currentData[0].detail}</Text>
              </View>

              {/* Rank 3 */}
              <View style={[styles.podiumItem, { marginTop: 40 }]}>
                    <View style={styles.podiumAvatarContainer}>
                        <View style={[styles.podiumAvatar, { borderColor: "#FEE2E2" }]}>
                             <Text style={styles.avatarText}>{currentData[2].avatar}</Text>
                        </View>
                        <View style={[styles.rankBadge, { backgroundColor: "#FCA5A5" }]}>
                             <Text style={[styles.rankText, { color: "#7F1D1D"}]}>3</Text>
                        </View>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{currentData[2].name}</Text>
                    <Text style={styles.podiumScore}>{currentData[2].detail}</Text>
              </View>
          </View>

        <View style={styles.listContainer}>
          {currentData.slice(3).map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listRank}>{item.rank}</Text>
              <View style={styles.listAvatar}>
                <Text style={styles.listAvatarText}>{item.avatar}</Text>
              </View>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.listScore}>{item.detail}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* My Rank Footer */}
      <View style={styles.myRankFooter}>
          <View style={styles.myRankContainer}>
            <Text style={styles.myRankLabel}>Hạng của bạn:</Text>
            <View style={styles.myRankInfo}>
                <View style={styles.myRankBadge}>
                    <Text style={styles.myRankText}>{myRank.rank}</Text>
                </View>
                <Text style={styles.myRankScore}>{myRank.detail}</Text>
            </View>
          </View>
      </View>
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
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#3B82F6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  podiumContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
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
      alignItems: 'center',
      width: 100,
  },
  podiumAvatarContainer: {
      marginBottom: 12,
      position: 'relative',
      alignItems: 'center',
  },
  podiumAvatar: {
      width: 64,
      height: 64,
      borderRadius: 999,
      backgroundColor: "#F3F4F6",
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
  },
  avatarText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: "#4B5563",
  },
  rankBadge: {
      position: 'absolute',
      bottom: -8,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: "#FFFFFF",
  },
  rankText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: "#374151",
  },
  podiumName: {
      fontSize: 14,
      fontWeight: '600',
      color: "#1F2937",
      marginBottom: 4,
      textAlign: 'center',
      width: '100%',
  },
  podiumScore: {
      fontSize: 14,
      fontWeight: 'bold',
      color: "#3B82F6",
  },
  listContainer: {
      padding: 16,
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
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
  listRank: {
      fontSize: 16,
      fontWeight: 'bold',
      color: "#6B7280",
      width: 30,
      textAlign: 'center',
      marginRight: 12,
  },
  listAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#EFF6FF",
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  listAvatarText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: "#3B82F6",
  },
  listName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: "#1F2937",
  },
  listScore: {
        fontSize: 15,
      fontWeight: 'bold',
      color: "#1F2937",
  },
  myRankFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#FFFFFF",
      padding: 16,
      paddingBottom: 24, // Safe area
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 8,
  },
  myRankContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  myRankLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: "#4B5563",
  },
  myRankInfo: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  myRankBadge: {
      backgroundColor: "#3B82F6",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 12,
  },
  myRankText: {
      color: "#FFFFFF",
      fontWeight: 'bold',
      fontSize: 14,
  },
  myRankScore: {
      fontSize: 16,
      fontWeight: 'bold',
      color: "#1F2937",
  }
});
