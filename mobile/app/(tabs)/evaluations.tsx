import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Appearance,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUiStore } from "@/lib/stores/ui-store";
import { useAuthStore } from "@/lib/stores";
import {
  useFeedbackStore,
  PendingEvaluation,
  CRITERIA_LABELS,
  EvaluationCriteria,
} from "@/lib/stores/feedback-store";

export default function EvaluationsScreen() {
  const { theme } = useUiStore();
  const { user } = useAuthStore();
  const colorScheme = theme === "system" ? Appearance.getColorScheme() : theme;
  const isDark = colorScheme === "dark";

  const {
    pendingEvaluations,
    activePeriods,
    myRatings,
    loading,
    fetchPendingEvaluations,
    fetchMyRatings,
    submitFeedback,
  } = useFeedbackStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] =
    useState<PendingEvaluation | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria>({
    teachingQuality: 0,
    communication: 0,
    punctuality: 0,
    materialPreparation: 0,
    studentInteraction: 0,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = user?.role === "teacher";

  useEffect(() => {
    if (isTeacher) {
      fetchMyRatings();
    } else {
      fetchPendingEvaluations();
    }
  }, [isTeacher]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isTeacher) {
      await fetchMyRatings();
    } else {
      await fetchPendingEvaluations();
    }
    setRefreshing(false);
  }, [isTeacher]);

  const openEvaluationModal = (teacher: PendingEvaluation) => {
    setSelectedTeacher(teacher);
    setCriteria({
      teachingQuality: 0,
      communication: 0,
      punctuality: 0,
      materialPreparation: 0,
      studentInteraction: 0,
    });
    setComment("");
    setModalVisible(true);
  };

  const calculateAverageRating = (): number => {
    const values = Object.values(criteria);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.length > 0 ? Math.round((sum / values.length) * 10) / 10 : 0;
  };

  const isFormValid = (): boolean => {
    return Object.values(criteria).every((val) => val > 0);
  };

  const handleSubmit = async () => {
    if (!selectedTeacher || !isFormValid()) {
      Alert.alert("Lỗi", "Vui lòng đánh giá tất cả các tiêu chí");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        teacherId: selectedTeacher.teacher._id,
        classId: selectedTeacher.classId,
        evaluationPeriodId: selectedTeacher.periodId,
        rating: calculateAverageRating(),
        criteria,
        comment: comment.trim() || undefined,
        anonymous: true,
        status: "submitted",
      });

      Alert.alert("Thành công", "Đánh giá đã được gửi thành công!");
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể gửi đánh giá",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    size = 28,
    disabled = false,
  }: {
    value: number;
    onChange?: (val: number) => void;
    size?: number;
    disabled?: boolean;
  }) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={disabled}
          onPress={() => onChange?.(star)}
        >
          <Ionicons
            name={star <= value ? "star" : "star-outline"}
            size={size}
            color={star <= value ? "#FBBF24" : "#D1D5DB"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render for Teacher - show their ratings
  if (isTeacher) {
    return (
      <ScrollView
        style={[styles.container, isDark && styles.containerDark]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient colors={["#10B981", "#059669"]} style={styles.header}>
          <Ionicons name="star" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
          <Text style={styles.headerSubtitle}>Xem đánh giá từ học sinh</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#10B981"
            style={styles.loader}
          />
        ) : myRatings?.totalFeedbacks === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={[styles.emptyText, isDark && styles.textDark]}>
              Chưa có đánh giá
            </Text>
            <Text style={[styles.emptySubtext, isDark && styles.textMuted]}>
              Bạn sẽ nhận được đánh giá từ học sinh sau khi kết thúc đợt đánh
              giá.
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Card */}
            <View style={[styles.statsCard, isDark && styles.cardDark]}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {myRatings?.stats.averageRating?.toFixed(1) || "0"}
                  </Text>
                  <Text style={[styles.statLabel, isDark && styles.textMuted]}>
                    Điểm TB
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {myRatings?.totalFeedbacks || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDark && styles.textMuted]}>
                    Tổng đánh giá
                  </Text>
                </View>
              </View>
              <StarRating
                value={Math.round(myRatings?.stats.averageRating || 0)}
                disabled
              />
            </View>

            {/* Criteria Breakdown */}
            {myRatings?.stats.averageCriteria && (
              <View style={[styles.criteriaCard, isDark && styles.cardDark]}>
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                  Chi tiết tiêu chí
                </Text>
                {(
                  Object.keys(CRITERIA_LABELS) as Array<
                    keyof EvaluationCriteria
                  >
                ).map((key) => (
                  <View key={key} style={styles.criteriaRow}>
                    <Text
                      style={[styles.criteriaLabel, isDark && styles.textMuted]}
                    >
                      {CRITERIA_LABELS[key]}
                    </Text>
                    <View style={styles.criteriaValue}>
                      <StarRating
                        value={Math.round(
                          myRatings.stats.averageCriteria![key] || 0,
                        )}
                        size={16}
                        disabled
                      />
                      <Text
                        style={[
                          styles.criteriaScore,
                          isDark && styles.textDark,
                        ]}
                      >
                        {myRatings.stats.averageCriteria![key]?.toFixed(1) ||
                          "-"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recent Feedbacks */}
            <View style={[styles.feedbacksSection, isDark && styles.cardDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                Nhận xét gần đây
              </Text>
              {myRatings?.feedbacks.slice(0, 5).map((fb) => (
                <View
                  key={fb._id}
                  style={[
                    styles.feedbackCard,
                    isDark && styles.feedbackCardDark,
                  ]}
                >
                  <View style={styles.feedbackHeader}>
                    <StarRating value={fb.rating} size={14} disabled />
                    <Text style={styles.feedbackDate}>
                      {new Date(fb.createdAt).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                  {fb.className && (
                    <Text style={styles.feedbackClass}>
                      Lớp: {fb.className}
                    </Text>
                  )}
                  {fb.comment && (
                    <Text
                      style={[
                        styles.feedbackComment,
                        isDark && styles.textMuted,
                      ]}
                    >
                      "{fb.comment}"
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  // Render for Student - show pending evaluations
  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient colors={["#3B82F6", "#2563EB"]} style={styles.header}>
        <Ionicons name="star" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Đánh giá giáo viên</Text>
        {activePeriods.length > 0 && (
          <Text style={styles.headerSubtitle}>
            Hạn:{" "}
            {new Date(activePeriods[0].endDate).toLocaleDateString("vi-VN")}
          </Text>
        )}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : pendingEvaluations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={[styles.emptyText, isDark && styles.textDark]}>
            Hoàn thành!
          </Text>
          <Text style={[styles.emptySubtext, isDark && styles.textMuted]}>
            Bạn đã hoàn thành tất cả đánh giá!
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={[styles.pendingCount, isDark && styles.textMuted]}>
            Bạn có {pendingEvaluations.length} giáo viên cần đánh giá
          </Text>
          {pendingEvaluations.map((item) => (
            <TouchableOpacity
              key={`${item.classId}-${item.teacher._id}`}
              style={[styles.teacherCard, isDark && styles.cardDark]}
              onPress={() => openEvaluationModal(item)}
            >
              <View style={styles.teacherInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color="#3B82F6" />
                </View>
                <View style={styles.teacherDetails}>
                  <Text style={[styles.teacherName, isDark && styles.textDark]}>
                    {item.teacher.name}
                  </Text>
                  <Text style={[styles.className, isDark && styles.textMuted]}>
                    {item.className}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Evaluation Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, isDark && styles.modalContentDark]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>
                Đánh giá giáo viên
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#fff" : "#374151"}
                />
              </TouchableOpacity>
            </View>

            {selectedTeacher && (
              <ScrollView style={styles.modalBody}>
                <Text
                  style={[styles.evaluatingTeacher, isDark && styles.textMuted]}
                >
                  Đánh giá cho{" "}
                  <Text style={styles.bold}>
                    {selectedTeacher.teacher.name}
                  </Text>{" "}
                  - {selectedTeacher.className}
                </Text>

                {/* Privacy Notice */}
                <View style={styles.privacyNotice}>
                  <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                  <Text style={styles.privacyText}>
                    Đánh giá của bạn hoàn toàn ẩn danh
                  </Text>
                </View>

                {/* Criteria Ratings */}
                {(
                  Object.keys(CRITERIA_LABELS) as Array<
                    keyof EvaluationCriteria
                  >
                ).map((key) => (
                  <View key={key} style={styles.criteriaInput}>
                    <Text
                      style={[
                        styles.criteriaInputLabel,
                        isDark && styles.textDark,
                      ]}
                    >
                      {CRITERIA_LABELS[key]}
                    </Text>
                    <StarRating
                      value={criteria[key]}
                      onChange={(val) =>
                        setCriteria((prev) => ({ ...prev, [key]: val }))
                      }
                    />
                  </View>
                ))}

                {/* Average Display */}
                {isFormValid() && (
                  <View style={styles.averageContainer}>
                    <Text style={styles.averageLabel}>Điểm trung bình:</Text>
                    <Text style={styles.averageValue}>
                      {calculateAverageRating()}/5
                    </Text>
                  </View>
                )}

                {/* Comment */}
                <Text style={[styles.commentLabel, isDark && styles.textDark]}>
                  Nhận xét (không bắt buộc)
                </Text>
                <TextInput
                  style={[styles.commentInput, isDark && styles.inputDark]}
                  placeholder="Chia sẻ cảm nhận của bạn..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  value={comment}
                  onChangeText={setComment}
                />
                <Text style={styles.charCount}>{comment.length}/500</Text>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!isFormValid() || submitting) &&
                      styles.submitButtonDisabled,
                  ]}
                  disabled={!isFormValid() || submitting}
                  onPress={handleSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  containerDark: {
    backgroundColor: "#0B1220",
  },
  header: {
    padding: 24,
    paddingTop: 48,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  loader: {
    marginTop: 48,
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  pendingCount: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  teacherCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: "#1F2937",
  },
  teacherInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EBF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  teacherDetails: {
    marginLeft: 12,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  className: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  textDark: {
    color: "#F9FAFB",
  },
  textMuted: {
    color: "#9CA3AF",
  },
  starContainer: {
    flexDirection: "row",
    gap: 4,
  },
  statsCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10B981",
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#E5E7EB",
  },
  criteriaCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  criteriaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  criteriaLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  criteriaValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  criteriaScore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    width: 32,
    textAlign: "right",
  },
  feedbacksSection: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  feedbackCard: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  feedbackCardDark: {
    backgroundColor: "#374151",
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  feedbackDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  feedbackClass: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  feedbackComment: {
    fontSize: 14,
    color: "#4B5563",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalContentDark: {
    backgroundColor: "#1F2937",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalBody: {
    padding: 16,
  },
  evaluatingTeacher: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  bold: {
    fontWeight: "600",
    color: "#111827",
  },
  privacyNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF5FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  privacyText: {
    fontSize: 14,
    color: "#3B82F6",
  },
  criteriaInput: {
    marginBottom: 16,
  },
  criteriaInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  averageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  averageLabel: {
    fontSize: 14,
    color: "#92400E",
  },
  averageValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F59E0B",
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    color: "#111827",
  },
  inputDark: {
    borderColor: "#4B5563",
    backgroundColor: "#374151",
    color: "#F9FAFB",
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
