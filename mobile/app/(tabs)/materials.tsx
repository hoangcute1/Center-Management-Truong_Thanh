import { useEffect, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/stores";
import documentsApi, { Document } from "@/lib/api/documents";

export default function MaterialsScreen() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  // Redirect if not teacher or student
  if (!isTeacher && !isStudent) {
    return <Redirect href="/(tabs)" />;
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
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
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Get API Base URL from the api instance
      const baseUrl = documentsApi['axiosInstance']?.defaults.baseURL || "http://192.168.101.87:3000";

      // Use the new download endpoint which handles incrementing count too
      const downloadUrl = `${baseUrl}/documents/${doc._id}/file`;

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

  const formatFileSize = (url: string): string => {
    // Since we don't have file size from backend, return placeholder
    return "N/A";
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIconBg}>
            <Ionicons name="document-text" size={22} color="#3B82F6" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Tài liệu học tập</Text>
            <Text style={styles.subtitle}>
              {isTeacher
                ? "Danh sách tài liệu giảng dạy của bạn"
                : "Tài liệu từ giáo viên"}
            </Text>
          </View>
        </View>

        {loading ? (
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
        ) : documents.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {isTeacher
                ? "Chưa có tài liệu nào. Hãy tải lên từ web!"
                : "Chưa có tài liệu nào"}
            </Text>
          </View>
        ) : (
          documents.map((doc) => {
            const fileType = getFileType(
              doc.originalFileName || doc.fileUrl
            );
            const colors = getFileColor(fileType);

            return (
              <TouchableOpacity
                key={doc._id}
                style={styles.documentCard}
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
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownload(doc)}
                >
                  <Ionicons name="download-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
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
});
