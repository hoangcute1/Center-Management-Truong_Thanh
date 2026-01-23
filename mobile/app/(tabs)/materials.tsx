import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { teachingDocuments } from "@/lib/constants/materials";
import { useAuthStore } from "@/lib/stores";

export default function MaterialsScreen() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher";

  if (!isTeacher) {
    return <Redirect href="/(tabs)" />;
  }

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
              Danh sách tài liệu giảng dạy dành cho giáo viên
            </Text>
          </View>
        </View>

        {teachingDocuments.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={styles.documentCard}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.documentIcon,
                {
                  backgroundColor:
                    doc.type === "PDF"
                      ? "#FEE2E2"
                      : doc.type === "DOCX"
                        ? "#DBEAFE"
                        : "#FEF3C7",
                },
              ]}
            >
              <Text
                style={[
                  styles.documentIconText,
                  {
                    color:
                      doc.type === "PDF"
                        ? "#DC2626"
                        : doc.type === "DOCX"
                          ? "#2563EB"
                          : "#D97706",
                  },
                ]}
              >
                {doc.type}
              </Text>
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName} numberOfLines={1}>
                {doc.name}
              </Text>
              <Text style={styles.documentMeta}>
                {doc.size} • {doc.uploadDate} • {doc.downloads} lượt tải
              </Text>
              <Text style={styles.documentClass}>{doc.className}</Text>
            </View>
            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
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
    fontSize: 12,
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
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
});
