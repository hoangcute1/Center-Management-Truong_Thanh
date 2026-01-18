import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";

const { width } = Dimensions.get("window");

interface PaymentSummary {
  totalRevenue: number;
  totalPending: number;
  totalCompleted: number;
  recentPayments: Payment[];
}

interface Payment {
  _id: string;
  userId?: {
    _id: string;
    fullName: string;
    email?: string;
  };
  studentId?: {
    _id: string;
    fullName: string;
  };
  amount: number;
  type?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  description?: string;
  method?: string;
  createdAt?: string;
}

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "time",
  },
  completed: {
    label: "Hoàn thành",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "checkmark-circle",
  },
  failed: {
    label: "Thất bại",
    color: "#EF4444",
    bg: "#FEE2E2",
    icon: "close-circle",
  },
  refunded: {
    label: "Hoàn tiền",
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: "return-down-back",
  },
};

const statusTabs = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "completed", label: "Hoàn thành" },
  { key: "failed", label: "Thất bại" },
];

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  // Summary stats
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalPending: 0,
    totalCompleted: 0,
    totalCount: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, [selectedStatus]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      const response = await api.get("/payments/admin/all", { params });
      const data = response.data.data || response.data || [];
      setPayments(Array.isArray(data) ? data : []);

      if (selectedStatus === "all") {
        calculateSummary(data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách thanh toán");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummary = (data: Payment[]) => {
    const total = data.reduce(
      (acc, p) => (p.status === "completed" ? acc + (p.amount || 0) : acc),
      0,
    );
    const pending = data.filter((p) => p.status === "pending").length;
    const completed = data.filter((p) => p.status === "completed").length;

    setSummary({
      totalRevenue: total,
      totalPending: pending,
      totalCompleted: completed,
      totalCount: data.length,
    });
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchPayments();
    setIsRefreshing(false);
  };

  const handleUpdateStatus = async (payment: Payment, newStatus: string) => {
    try {
      await api.patch(`/payments/${payment._id}`, { status: newStatus });
      Alert.alert("Thành công", "Đã cập nhật trạng thái thanh toán");
      setIsDetailVisible(false);
      fetchPayments();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} Tỷ`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} Tr`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

  const openDetail = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailVisible(true);
  };

  const renderPaymentCard = ({ item: payment }: { item: Payment }) => {
    const status = statusConfig[payment.status] || statusConfig.pending;

    return (
      <TouchableOpacity
        style={styles.paymentCard}
        onPress={() => openDetail(payment)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
            <Ionicons
              name={status.icon as any}
              size={20}
              color={status.color}
            />
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.paymentAmount}>
              {formatCurrency(payment.amount || 0)}
            </Text>
            <Text style={styles.paymentType}>
              {payment.description || "Thanh toán học phí"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {payment.userId && (
              <View style={styles.userInfo}>
                <Ionicons name="person-outline" size={14} color="#6B7280" />
                <Text style={styles.userText}>{payment.userId.fullName}</Text>
              </View>
            )}
            {payment.studentId && (
              <View style={styles.userInfo}>
                <Ionicons name="school-outline" size={14} color="#6B7280" />
                <Text style={styles.userText}>
                  HS: {payment.studentId.fullName}
                </Text>
              </View>
            )}
          </View>
          {payment.createdAt && (
            <Text style={styles.dateText}>
              {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Header */}
      <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
        <Text style={styles.headerTitle}>💳 Quản lý thanh toán</Text>
        <Text style={styles.headerSubtitle}>
          Theo dõi doanh thu và giao dịch
        </Text>
      </LinearGradient>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardLarge]}>
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              style={styles.summaryGradient}
            >
              <Ionicons name="wallet" size={28} color="#FFFFFF" />
              <Text style={styles.summaryValue}>
                {formatCompactCurrency(summary.totalRevenue)}
              </Text>
              <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCardSmall}>
            <Text style={[styles.summaryValueSmall, { color: "#F59E0B" }]}>
              {summary.totalPending}
            </Text>
            <Text style={styles.summaryLabelSmall}>Chờ xác nhận</Text>
          </View>
          <View style={styles.summaryCardSmall}>
            <Text style={[styles.summaryValueSmall, { color: "#10B981" }]}>
              {summary.totalCompleted}
            </Text>
            <Text style={styles.summaryLabelSmall}>Hoàn thành</Text>
          </View>
          <View style={styles.summaryCardSmall}>
            <Text style={[styles.summaryValueSmall, { color: "#6366F1" }]}>
              {summary.totalCount}
            </Text>
            <Text style={styles.summaryLabelSmall}>Tổng giao dịch</Text>
          </View>
        </View>
      </View>

      {/* Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContainer}
      >
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.statusTab,
              selectedStatus === tab.key && styles.statusTabActive,
            ]}
            onPress={() => setSelectedStatus(tab.key)}
          >
            <Text
              style={[
                styles.statusTabText,
                selectedStatus === tab.key && styles.statusTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Payments List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không có giao dịch nào</Text>
            </View>
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsDetailVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsDetailVisible(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chi tiết giao dịch</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedPayment && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.paymentHeader}>
                <Text style={styles.modalAmount}>
                  {formatCurrency(selectedPayment.amount || 0)}
                </Text>
                <View
                  style={[
                    styles.statusBadgeLarge,
                    {
                      backgroundColor:
                        statusConfig[selectedPayment.status]?.bg || "#F3F4F6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTextLarge,
                      {
                        color:
                          statusConfig[selectedPayment.status]?.color ||
                          "#6B7280",
                      },
                    ]}
                  >
                    {statusConfig[selectedPayment.status]?.label ||
                      "Không xác định"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#6B7280"
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Mô tả</Text>
                    <Text style={styles.infoValue}>
                      {selectedPayment.description || "Thanh toán học phí"}
                    </Text>
                  </View>
                </View>

                {selectedPayment.userId && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Người thanh toán</Text>
                      <Text style={styles.infoValue}>
                        {selectedPayment.userId.fullName}
                      </Text>
                      {selectedPayment.userId.email && (
                        <Text style={styles.infoSubValue}>
                          {selectedPayment.userId.email}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {selectedPayment.studentId && (
                  <View style={styles.infoRow}>
                    <Ionicons name="school-outline" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Học sinh</Text>
                      <Text style={styles.infoValue}>
                        {selectedPayment.studentId.fullName}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedPayment.method && (
                  <View style={styles.infoRow}>
                    <Ionicons name="card-outline" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Phương thức</Text>
                      <Text style={styles.infoValue}>
                        {selectedPayment.method}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedPayment.createdAt && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Ngày tạo</Text>
                      <Text style={styles.infoValue}>
                        {new Date(selectedPayment.createdAt).toLocaleString(
                          "vi-VN",
                        )}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              {selectedPayment.status === "pending" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: "#D1FAE5" },
                    ]}
                    onPress={() =>
                      handleUpdateStatus(selectedPayment, "completed")
                    }
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#059669"
                    />
                    <Text
                      style={[styles.actionButtonText, { color: "#059669" }]}
                    >
                      Xác nhận thanh toán
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: "#FEE2E2" },
                    ]}
                    onPress={() =>
                      handleUpdateStatus(selectedPayment, "failed")
                    }
                  >
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                    <Text
                      style={[styles.actionButtonText, { color: "#DC2626" }]}
                    >
                      Từ chối
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  // Summary
  summaryContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  summaryCardLarge: {
    height: 100,
  },
  summaryGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  summaryLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  summaryCardSmall: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryValueSmall: {
    fontSize: 22,
    fontWeight: "700",
  },
  summaryLabelSmall: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  // Tabs
  tabsScrollView: {
    marginVertical: 12,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  statusTabActive: {
    backgroundColor: "#22C55E",
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  statusTabTextActive: {
    color: "#FFFFFF",
  },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  paymentType: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerLeft: {
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  userText: {
    fontSize: 12,
    color: "#6B7280",
  },
  dateText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  paymentHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
    marginTop: 2,
  },
  infoSubValue: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  actionButtons: {
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
