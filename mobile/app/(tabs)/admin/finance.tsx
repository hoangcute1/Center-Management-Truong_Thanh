import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";

const { width } = Dimensions.get("window");

// Finance summary data
const financeSummary = [
  {
    label: "Tổng doanh thu",
    value: "720 Tr",
    trend: "+8% so với quý trước",
    icon: "trending-up" as const,
    colors: ["#10B981", "#059669"],
  },
  {
    label: "Chi phí",
    value: "185 Tr",
    trend: "+5% so với quý trước",
    icon: "trending-down" as const,
    colors: ["#EF4444", "#DC2626"],
  },
  {
    label: "Lợi nhuận ròng",
    value: "535 Tr",
    trend: "+10% so với quý trước",
    icon: "diamond" as const,
    colors: ["#6366F1", "#4F46E5"],
  },
];

// Finance chart data
const financeChart = [
  { month: "T1", revenue: 50, cost: 20 },
  { month: "T2", revenue: 62, cost: 22 },
  { month: "T3", revenue: 58, cost: 20 },
  { month: "T4", revenue: 75, cost: 25 },
  { month: "T5", revenue: 68, cost: 23 },
  { month: "T6", revenue: 82, cost: 28 },
];

// Recent transactions
const recentTransactions = [
  {
    id: "1",
    type: "income",
    description: "Học phí - Nguyễn Văn A",
    amount: 2500000,
    date: "2025-01-15",
    icon: "arrow-down" as const,
  },
  {
    id: "2",
    type: "expense",
    description: "Lương giáo viên - Tháng 1",
    amount: 15000000,
    date: "2025-01-14",
    icon: "arrow-up" as const,
  },
  {
    id: "3",
    type: "income",
    description: "Học phí - Trần Thị B",
    amount: 3000000,
    date: "2025-01-13",
    icon: "arrow-down" as const,
  },
  {
    id: "4",
    type: "expense",
    description: "Chi phí điện nước",
    amount: 2000000,
    date: "2025-01-12",
    icon: "arrow-up" as const,
  },
  {
    id: "5",
    type: "income",
    description: "Học phí - Lê Văn C",
    amount: 2800000,
    date: "2025-01-11",
    icon: "arrow-down" as const,
  },
];

export default function FinanceScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");

  const maxRevenue = Math.max(...financeChart.map((item) => item.revenue));

  const onRefresh = async () => {
    setIsLoading(true);
    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}Tr`;
    }
    return `${(amount / 1000).toFixed(0)}K`;
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
        <LinearGradient colors={["#10B981", "#059669"]} style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="wallet" size={28} color="#FFFFFF" />
            <View style={styles.headerInfo}>
              <Text style={styles.headerValue}>535 Tr</Text>
              <Text style={styles.headerSubtitle}>Lợi nhuận ròng quý này</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Tổng quan tài chính</Text>
          <View style={styles.summaryGrid}>
            {financeSummary.map((item, index) => (
              <View key={index} style={styles.summaryCard}>
                <LinearGradient
                  colors={item.colors as [string, string]}
                  style={styles.summaryCardGradient}
                >
                  <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                  <Text style={styles.summaryValue}>{item.value}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={styles.summaryTrend}>{item.trend}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📊 Biểu đồ doanh thu - chi phí
          </Text>
          <View style={styles.periodSelector}>
            {(["week", "month", "year"] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period === "week"
                    ? "Tuần"
                    : period === "month"
                      ? "Tháng"
                      : "Năm"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Revenue vs Cost Chart */}
          <View style={styles.chartCard}>
            <View style={styles.barChartContainer}>
              {financeChart.map((item, index) => (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barPair}>
                    {/* Revenue Bar */}
                    <View style={styles.barBackground}>
                      <LinearGradient
                        colors={["#10B981", "#059669"]}
                        style={[
                          styles.bar,
                          { height: `${(item.revenue / maxRevenue) * 100}%` },
                        ]}
                      />
                    </View>
                    {/* Cost Bar */}
                    <View style={styles.barBackground}>
                      <LinearGradient
                        colors={["#EF4444", "#DC2626"]}
                        style={[
                          styles.bar,
                          { height: `${(item.cost / maxRevenue) * 100}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.barLabel}>{item.month}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#10B981" }]}
                />
                <Text style={styles.legendText}>Doanh thu</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#EF4444" }]}
                />
                <Text style={styles.legendText}>Chi phí</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📝 Giao dịch gần đây</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        transaction.type === "income" ? "#D1FAE5" : "#FEE2E2",
                    },
                  ]}
                >
                  <Ionicons
                    name={transaction.icon}
                    size={20}
                    color={
                      transaction.type === "income" ? "#059669" : "#DC2626"
                    }
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDesc}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === "income" ? "#059669" : "#DC2626",
                    },
                  ]}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Thống kê nhanh</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>248</Text>
              <Text style={styles.quickStatLabel}>Học sinh đóng học phí</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>95%</Text>
              <Text style={styles.quickStatLabel}>Tỷ lệ thu hồi</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>12</Text>
              <Text style={styles.quickStatLabel}>Học sinh nợ học phí</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>28.5Tr</Text>
              <Text style={styles.quickStatLabel}>TB học phí/học sinh</Text>
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
    fontSize: 28,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  // Summary Grid
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  summaryCard: {
    width: (width - 44) / 3,
    marginHorizontal: 3,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCardGradient: {
    padding: 12,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    textAlign: "center",
  },
  summaryTrend: {
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    textAlign: "center",
  },
  // Period Selector
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: "#10B981",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
  },
  // Chart
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    paddingHorizontal: 8,
  },
  barGroup: {
    alignItems: "center",
    flex: 1,
  },
  barPair: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 4,
  },
  barBackground: {
    width: 14,
    height: 120,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    fontWeight: "500",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  // Transactions
  transactionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Quick Stats
  quickStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  quickStatCard: {
    width: (width - 44) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#10B981",
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
});
