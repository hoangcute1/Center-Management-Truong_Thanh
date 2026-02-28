import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore, useClassesStore, Class } from "@/lib/stores";

const safeGoBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)");
  }
};
import {
  gradingService,
  GradingSheet,
  GradingSheetWithStudents,
  StudentGrade,
  GradeCategory,
  GRADE_CATEGORY_LABELS,
  CreateGradingSheetDto,
} from "@/lib/services/grading.service";

// Get category color
const getCategoryColor = (category: GradeCategory): [string, string] => {
  switch (category) {
    case "test_15p":
      return ["#10B981", "#059669"];
    case "test_30p":
      return ["#3B82F6", "#2563EB"];
    case "giua_ky":
      return ["#8B5CF6", "#7C3AED"];
    case "cuoi_ky":
      return ["#EF4444", "#DC2626"];
    case "khac":
    default:
      return ["#6B7280", "#4B5563"];
  }
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Create Grading Sheet Modal
function CreateSheetModal({
  visible,
  onClose,
  onSubmit,
  classes,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGradingSheetDto) => void;
  classes: Class[];
  isLoading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [category, setCategory] = useState<GradeCategory>("test_15p");
  const [maxScore, setMaxScore] = useState("10");
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !selectedClass) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề và chọn lớp");
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      classId: selectedClass,
      category,
      maxScore: parseFloat(maxScore) || 10,
    });
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedClass("");
    setCategory("test_15p");
    setMaxScore("10");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedClassName =
    classes.find((c) => c._id === selectedClass)?.name || "Chọn lớp";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.createModalContainer}
        >
          <View style={styles.createModalHeader}>
            <Text style={styles.createModalTitle}>Tạo bảng điểm mới</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createModalForm}>
            {/* Title */}
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Kiểm tra 15p - Chương 1"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />

            {/* Description */}
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập mô tả (tùy chọn)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />

            {/* Class Picker */}
            <Text style={styles.label}>Lớp *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowClassPicker(true)}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !selectedClass && { color: "#9CA3AF" },
                ]}
              >
                {selectedClassName}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* Category Picker */}
            <Text style={styles.label}>Loại bài kiểm tra *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {GRADE_CATEGORY_LABELS[category]}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* Max Score */}
            <Text style={styles.label}>Điểm tối đa</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              value={maxScore}
              onChangeText={setMaxScore}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Tạo bảng điểm</Text>
            )}
          </TouchableOpacity>

          {/* Class Picker Modal */}
          <Modal visible={showClassPicker} transparent animationType="fade">
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowClassPicker(false)}
            >
              <View style={styles.pickerList}>
                <FlatList
                  data={classes}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedClass(item._id);
                        setShowClassPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{item.name}</Text>
                      {selectedClass === item._id && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Category Picker Modal */}
          <Modal visible={showCategoryPicker} transparent animationType="fade">
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowCategoryPicker(false)}
            >
              <View style={styles.pickerList}>
                {(Object.keys(GRADE_CATEGORY_LABELS) as GradeCategory[]).map(
                  (key) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.pickerItem}
                      onPress={() => {
                        setCategory(key);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {GRADE_CATEGORY_LABELS[key]}
                      </Text>
                      {category === key && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </TouchableOpacity>
          </Modal>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// Grade Students Modal
function GradeStudentsModal({
  visible,
  onClose,
  sheetData,
  onSave,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  sheetData: GradingSheetWithStudents | null;
  onSave: (
    grades: { studentId: string; score: number; feedback?: string }[],
  ) => void;
  isLoading: boolean;
}) {
  const [studentGrades, setStudentGrades] = useState<
    Record<string, { score: string; feedback: string }>
  >({});

  useEffect(() => {
    if (sheetData?.students) {
      const initial: Record<string, { score: string; feedback: string }> = {};
      sheetData.students.forEach((s) => {
        initial[s._id] = {
          score: s.score !== null ? s.score.toString() : "",
          feedback: s.feedback || "",
        };
      });
      setStudentGrades(initial);
    }
  }, [sheetData]);

  const handleSave = () => {
    if (!sheetData) return;

    const grades = Object.entries(studentGrades)
      .filter(([_, g]) => g.score !== "")
      .map(([studentId, g]) => ({
        studentId,
        score: parseFloat(g.score),
        feedback: g.feedback || undefined,
      }));

    if (grades.length === 0) {
      Alert.alert("Lỗi", "Vui lòng nhập điểm cho ít nhất một học sinh");
      return;
    }

    onSave(grades);
  };

  if (!sheetData) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.gradeModalContainer} edges={["top"]}>
        <View style={styles.gradeModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.gradeModalTitle} numberOfLines={1}>
              {sheetData.gradingSheet.title}
            </Text>
            <Text style={styles.gradeModalSubtitle}>
              {sheetData.gradingSheet.classId.name} • {sheetData.summary.graded}
              /{sheetData.summary.total} đã chấm
            </Text>
          </View>
        </View>

        <FlatList
          data={sheetData.students}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.studentsList}
          renderItem={({ item }) => (
            <View style={styles.studentGradeCard}>
              <View style={styles.studentInfo}>
                <LinearGradient
                  colors={
                    item.graded
                      ? ["#10B981", "#059669"]
                      : ["#9CA3AF", "#6B7280"]
                  }
                  style={styles.studentAvatar}
                >
                  <Text style={styles.studentAvatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentEmail}>{item.email}</Text>
                </View>
              </View>

              <View style={styles.gradeInputRow}>
                <View style={styles.scoreInputContainer}>
                  <Text style={styles.scoreLabel}>Điểm</Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="--"
                    value={studentGrades[item._id]?.score || ""}
                    onChangeText={(v) =>
                      setStudentGrades((prev) => ({
                        ...prev,
                        [item._id]: { ...prev[item._id], score: v },
                      }))
                    }
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.maxScoreText}>
                    /{sheetData.gradingSheet.maxScore}
                  </Text>
                </View>

                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Nhận xét..."
                  value={studentGrades[item._id]?.feedback || ""}
                  onChangeText={(v) =>
                    setStudentGrades((prev) => ({
                      ...prev,
                      [item._id]: { ...prev[item._id], feedback: v },
                    }))
                  }
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          )}
        />

        <View style={styles.gradeModalFooter}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Lưu điểm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function TeacherGradingScreen() {
  const { user } = useAuthStore();
  const { classes, fetchClasses } = useClassesStore();
  const [sheets, setSheets] = useState<GradingSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSheet, setSelectedSheet] =
    useState<GradingSheetWithStudents | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is teacher
  if (user?.role !== "teacher") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.notTeacher}>
          <Ionicons name="close-circle" size={64} color="#EF4444" />
          <Text style={styles.notTeacherText}>
            Chức năng này chỉ dành cho giáo viên
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => safeGoBack()}
          >
            <Text style={styles.goBackButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fetchSheets = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await gradingService.getGradingSheets();
      setSheets(data);
    } catch (error) {
      console.error("Error fetching grading sheets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchClasses();
    fetchSheets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSheets();
  };

  const handleCreateSheet = async (data: CreateGradingSheetDto) => {
    try {
      setIsSubmitting(true);
      await gradingService.createGradingSheet(data);
      setShowCreateModal(false);
      fetchSheets();
      Alert.alert("Thành công", "Đã tạo bảng điểm mới");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể tạo bảng điểm");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSheet = async (sheet: GradingSheet) => {
    try {
      setLoading(true);
      const data = await gradingService.getGradingSheetWithStudents(sheet._id);
      setSelectedSheet(data);
      setShowGradeModal(true);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể mở bảng điểm");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrades = async (
    grades: { studentId: string; score: number; feedback?: string }[],
  ) => {
    if (!selectedSheet) return;

    try {
      setIsSubmitting(true);
      await gradingService.bulkGradeStudents(selectedSheet.gradingSheet._id, {
        grades,
      });
      setShowGradeModal(false);
      setSelectedSheet(null);
      fetchSheets();
      Alert.alert("Thành công", "Đã lưu điểm");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể lưu điểm");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter classes for teacher
  const teacherClasses = classes.filter((c) => {
    const teacherId =
      typeof c.teacherId === "object" && c.teacherId !== null
        ? (c.teacherId as any)._id
        : c.teacherId;
    return teacherId === user?._id || c.teacher?._id === user?._id;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeGoBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chấm điểm</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sheets.length}</Text>
          <Text style={styles.statLabel}>Bảng điểm</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{teacherClasses.length}</Text>
          <Text style={styles.statLabel}>Lớp dạy</Text>
        </View>
      </View>

      {/* Sheets List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : sheets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Chưa có bảng điểm</Text>
          <Text style={styles.emptySubtitle}>Nhấn + để tạo bảng điểm mới</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.listContainer}>
            {sheets.map((sheet) => (
              <TouchableOpacity
                key={sheet._id}
                style={styles.sheetCard}
                onPress={() => handleOpenSheet(sheet)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={getCategoryColor(sheet.category)}
                  style={styles.sheetIcon}
                >
                  <Ionicons name="document-text" size={24} color="#FFFFFF" />
                </LinearGradient>

                <View style={styles.sheetInfo}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {sheet.title}
                  </Text>
                  <Text style={styles.sheetClass}>{sheet.classId.name}</Text>
                  <View style={styles.sheetMeta}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {GRADE_CATEGORY_LABELS[sheet.category]}
                      </Text>
                    </View>
                    <Text style={styles.sheetDate}>
                      {formatDate(sheet.createdAt)}
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Create Modal */}
      <CreateSheetModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSheet}
        classes={teacherClasses}
        isLoading={isSubmitting}
      />

      {/* Grade Modal */}
      <GradeStudentsModal
        visible={showGradeModal}
        onClose={() => {
          setShowGradeModal(false);
          setSelectedSheet(null);
        }}
        sheetData={selectedSheet}
        onSave={handleSaveGrades}
        isLoading={isSubmitting}
      />
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sheetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sheetIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sheetInfo: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  sheetClass: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  sheetMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: "#3B82F6",
    fontWeight: "500",
  },
  sheetDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  notTeacher: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  notTeacherText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
  },
  goBackButton: {
    marginTop: 20,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  createModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  createModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  createModalForm: {
    padding: 16,
    maxHeight: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 15,
    color: "#1F2937",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  pickerList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    maxHeight: 300,
    padding: 8,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerItemText: {
    fontSize: 15,
    color: "#1F2937",
  },

  // Grade Modal styles
  gradeModalContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  gradeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  gradeModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  gradeModalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  studentsList: {
    padding: 16,
  },
  studentGradeCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  studentEmail: {
    fontSize: 13,
    color: "#6B7280",
  },
  gradeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scoreLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 8,
  },
  scoreInput: {
    width: 50,
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  maxScoreText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  feedbackInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#1F2937",
  },
  gradeModalFooter: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
