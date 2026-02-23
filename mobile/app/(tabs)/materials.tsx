import { useEffect, useState, useCallback } from "react";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  TextInput,
  FlatList,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useAuthStore, useClassesStore, Class } from "@/lib/stores";
import documentsApi, { Document } from "@/lib/api/documents";

// Upload Modal Component
function UploadModal({
  visible,
  onClose,
  onSubmit,
  classes,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    file: DocumentPicker.DocumentPickerAsset;
    title: string;
    description?: string;
    classIds?: string[];
    visibility: "class" | "community";
  }) => void;
  classes: Class[];
  isLoading: boolean;
}) {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"class" | "community">("class");
  const [showClassPicker, setShowClassPicker] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFile(result.assets[0]);
        // Auto-fill title from filename
        if (!title) {
          const fileName = result.assets[0].name || "";
          setTitle(fileName.replace(/\.[^/.]+$/, "")); // Remove extension
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Lỗi", "Không thể chọn file");
    }
  };

  const handleSubmit = () => {
    if (!file) {
      Alert.alert("Lỗi", "Vui lòng chọn file");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề");
      return;
    }
    if (visibility === "class" && selectedClasses.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một lớp");
      return;
    }

    onSubmit({
      file,
      title: title.trim(),
      description: description.trim() || undefined,
      classIds: visibility === "class" ? selectedClasses : undefined,
      visibility,
    });
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setSelectedClasses([]);
    setVisibility("class");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tải lên tài liệu</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            {/* File Picker */}
            <Text style={styles.label}>File tài liệu *</Text>
            <TouchableOpacity style={styles.fileButton} onPress={handlePickFile}>
              <Ionicons
                name={file ? "document-attach" : "cloud-upload-outline"}
                size={24}
                color={file ? "#10B981" : "#3B82F6"}
              />
              <Text style={[styles.fileButtonText, file && { color: "#10B981" }]}>
                {file ? file.name : "Chọn file..."}
              </Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề tài liệu"
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

            {/* Visibility Toggle */}
            <Text style={styles.label}>Phạm vi chia sẻ</Text>
            <View style={styles.visibilityToggle}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === "class" && styles.visibilityOptionActive,
                ]}
                onPress={() => setVisibility("class")}
              >
                <Ionicons
                  name="school-outline"
                  size={18}
                  color={visibility === "class" ? "#FFFFFF" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.visibilityText,
                    visibility === "class" && styles.visibilityTextActive,
                  ]}
                >
                  Lớp học
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === "community" && styles.visibilityOptionActive,
                  visibility === "community" && { backgroundColor: "#8B5CF6" },
                ]}
                onPress={() => setVisibility("community")}
              >
                <Ionicons
                  name="globe-outline"
                  size={18}
                  color={visibility === "community" ? "#FFFFFF" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.visibilityText,
                    visibility === "community" && styles.visibilityTextActive,
                  ]}
                >
                  Cộng đồng
                </Text>
              </TouchableOpacity>
            </View>

            {/* Class Selection (only for class visibility) */}
            {visibility === "class" && (
              <>
                <Text style={styles.label}>Chọn lớp *</Text>
                <TouchableOpacity
                  style={styles.classPickerButton}
                  onPress={() => setShowClassPicker(true)}
                >
                  <Text style={styles.classPickerText}>
                    {selectedClasses.length > 0
                      ? `Đã chọn ${selectedClasses.length} lớp`
                      : "Chọn lớp..."}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Tải lên</Text>
              </>
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
                <Text style={styles.pickerTitle}>Chọn lớp</Text>
                <FlatList
                  data={classes}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => toggleClass(item._id)}
                    >
                      <Text style={styles.pickerItemText}>{item.name}</Text>
                      <Ionicons
                        name={
                          selectedClasses.includes(item._id)
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={22}
                        color={
                          selectedClasses.includes(item._id)
                            ? "#3B82F6"
                            : "#9CA3AF"
                        }
                      />
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={styles.pickerDone}
                  onPress={() => setShowClassPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Xong</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}

export default function MaterialsScreen() {
  const { user, accessToken } = useAuthStore();
  const { classes, fetchClasses } = useClassesStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "class" | "community">("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  // Redirect if not teacher or student
  if (!isTeacher && !isStudent) {
    return <Redirect href="/(tabs)" />;
  }

  useEffect(() => {
    if (isTeacher) {
      fetchClasses();
    }
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      const data = isTeacher
        ? await documentsApi.getMyDocuments()
        : await documentsApi.getForStudent();
      setDocuments(data);
    } catch (err: any) {
      console.error("Error loading documents:", err);
      setError(err.message || "Lỗi khi tải tài liệu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDocuments();
  }, []);

  const handleUpload = async (data: {
    file: DocumentPicker.DocumentPickerAsset;
    title: string;
    description?: string;
    classIds?: string[];
    visibility: "class" | "community";
  }) => {
    try {
      setIsUploading(true);
      await documentsApi.uploadDocument(data);
      setShowUploadModal(false);
      loadDocuments();
      Alert.alert("Thành công", "Đã tải lên tài liệu");
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể tải lên tài liệu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (doc: Document) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa tài liệu "${doc.title}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await documentsApi.deleteDocument(doc._id);
              loadDocuments();
              Alert.alert("Thành công", "Đã xóa tài liệu");
            } catch (err: any) {
              Alert.alert("Lỗi", err.message || "Không thể xóa tài liệu");
            }
          },
        },
      ]
    );
  };

  const handleDownload = async (doc: Document) => {
    try {
      const baseUrl =
        documentsApi["axiosInstance"]?.defaults.baseURL ||
        "http://192.168.101.87:3000";
      const downloadUrl = `${baseUrl}/documents/${doc._id}/file?token=${accessToken}`;

      const canOpen = await Linking.canOpenURL(downloadUrl);
      if (canOpen) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert("Lỗi", "Không thể mở file");
      }
    } catch (err) {
      console.error("Error downloading document:", err);
      Alert.alert("Lỗi", "Không thể tải file");
    }
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName?.split(".").pop()?.toUpperCase() || "FILE";
    return ext;
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case "PDF":
        return { bg: "#FEE2E2", text: "#DC2626" };
      case "DOCX":
      case "DOC":
        return { bg: "#DBEAFE", text: "#2563EB" };
      case "PPTX":
      case "PPT":
        return { bg: "#FEF3C7", text: "#D97706" };
      case "XLSX":
      case "XLS":
        return { bg: "#D1FAE5", text: "#059669" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filter === "all") return true;
    return doc.visibility === filter;
  });

  // Get teacher's classes
  const teacherClasses = classes.filter(
    (c: any) =>
      c.teacherId?._id === user?._id ||
      c.teacherId === user?._id
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* FAB for Teacher Upload */}
      {isTeacher && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerIconBg}>
            <Ionicons name="document-text" size={22} color="#3B82F6" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Tài liệu học tập</Text>
            <Text style={styles.subtitle}>
              {isTeacher
                ? "Quản lý tài liệu giảng dạy"
                : "Tài liệu từ giáo viên"}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        {!loading && documents.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "all" && styles.filterTabActive,
              ]}
              onPress={() => setFilter("all")}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === "all" && styles.filterTabTextActive,
                ]}
              >
                Tất cả ({documents.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "class" && styles.filterTabActive,
              ]}
              onPress={() => setFilter("class")}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === "class" && styles.filterTabTextActive,
                ]}
              >
                🔒 Lớp học (
                {documents.filter((d) => d.visibility === "class").length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "community" && styles.filterTabActive,
                filter === "community" && { backgroundColor: "#8B5CF6" },
              ]}
              onPress={() => setFilter("community")}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === "community" && styles.filterTabTextActive,
                ]}
              >
                🌐 Cộng đồng (
                {documents.filter((d) => d.visibility === "community").length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Đang tải tài liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadDocuments}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {filter === "all"
                ? isTeacher
                  ? "Chưa có tài liệu nào. Nhấn + để tải lên!"
                  : "Chưa có tài liệu nào"
                : "Không tìm thấy tài liệu trong mục này"}
            </Text>
          </View>
        ) : (
          filteredDocuments.map((doc) => {
            const fileType = getFileType(
              doc.originalFileName || doc.fileUrl
            );
            const colors = getFileColor(fileType);

            return (
              <View key={doc._id} style={styles.documentCard}>
                <TouchableOpacity
                  style={styles.documentContent}
                  activeOpacity={0.7}
                  onPress={() => handleDownload(doc)}
                >
                  <View
                    style={[styles.documentIcon, { backgroundColor: colors.bg }]}
                  >
                    <Text style={[styles.documentIconText, { color: colors.text }]}>
                      {fileType}
                    </Text>
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <Text style={styles.documentMeta} numberOfLines={1}>
                      {doc.downloadCount} lượt tải • {formatDate(doc.createdAt)}
                    </Text>
                    {doc.classIds && doc.classIds.length > 0 && (
                      <Text style={styles.documentClass} numberOfLines={1}>
                        {doc.classIds.map((c) => c.name).join(", ")}
                      </Text>
                    )}
                    {doc.visibility === "community" && (
                      <Text style={styles.communityBadge}>🌐 Cộng đồng</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.documentActions}>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(doc)}
                  >
                    <Ionicons name="download-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                  {isTeacher && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(doc)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Upload Modal */}
      {isTeacher && (
        <UploadModal
          visible={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleUpload}
          classes={teacherClasses}
          isLoading={isUploading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
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
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  documentIconText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  documentClass: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  communityBadge: {
    fontSize: 11,
    color: "#8B5CF6",
    marginTop: 2,
  },
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterTabActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Document card updates
  documentContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  documentActions: {
    flexDirection: "row",
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
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
    color: "#1F2937",
  },
  modalForm: {
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
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    borderStyle: "dashed",
  },
  fileButtonText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  visibilityToggle: {
    flexDirection: "row",
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  visibilityOptionActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  visibilityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  visibilityTextActive: {
    color: "#FFFFFF",
  },
  classPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  classPickerText: {
    fontSize: 15,
    color: "#6B7280",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
    maxHeight: 350,
    padding: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerItemText: {
    fontSize: 15,
    color: "#1F2937",
  },
  pickerDone: {
    padding: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
  },
  pickerDoneText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
});

