import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useAuthStore,
  useNotificationsStore,
  useClassesStore,
} from "@/lib/stores";
import { router } from "expo-router";

const getRoleLabel = (role: string) => {
  switch (role) {
    case "student":
      return "Học sinh";
    case "teacher":
      return "Giáo viên";
    case "parent":
      return "Phụ huynh";
    case "admin":
      return "Quản trị viên";
    default:
      return role;
  }
};

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationsStore();
  const { classes, fetchClasses, isLoading } = useClassesStore();

  useEffect(() => {
    fetchNotifications();
    fetchClasses();
  }, []);

  const onRefresh = async () => {
    await Promise.all([fetchNotifications(), fetchClasses()]);
  };

  const quickActions = [
    {
      icon: "calendar" as const,
      label: "Lịch học",
      color: "#3B82F6",
      onPress: () => router.push("/(tabs)/schedule"),
    },
    {
      icon: "school" as const,
      label: "Lớp học",
      color: "#10B981",
      onPress: () => router.push("/(tabs)/classes"),
    },
    {
      icon: "notifications" as const,
      label: "Thông báo",
      color: "#F59E0B",
      badge: unreadCount,
      onPress: () => router.push("/(tabs)/notifications"),
    },
    {
      icon: "person" as const,
      label: "Tài khoản",
      color: "#8B5CF6",
      onPress: () => router.push("/(tabs)/profile"),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={60} color="#3B82F6" />
          </View>
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName}>
              {user?.fullName || "Người dùng"}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {getRoleLabel(user?.role || "")}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={action.onPress}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: `${action.color}15` },
                  ]}
                >
                  <Ionicons name={action.icon} size={28} color={action.color} />
                  {action.badge && action.badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {action.badge > 9 ? "9+" : action.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lớp học của tôi</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/classes")}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {classes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="school-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Chưa có lớp học nào</Text>
            </View>
          ) : (
            classes.slice(0, 3).map((classItem) => (
              <TouchableOpacity key={classItem._id} style={styles.classCard}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  <Text style={styles.classSubject}>{classItem.subject}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  welcomeSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3B82F6",
  },
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
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  quickActionCard: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  quickActionIcon: {
    width: "100%",
    aspectRatio: 1.5,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  classCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  classSubject: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
});
