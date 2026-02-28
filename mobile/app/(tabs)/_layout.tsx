import { Redirect, Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/stores";
import { useUiStore } from "@/lib/stores/ui-store";
import { View, Platform, TouchableOpacity, Appearance } from "react-native";
import { ActivityIndicator } from "react-native";

export default function TabsLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const { theme } = useUiStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isLoading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const role = user?.role;
  const colorScheme = theme === "system" ? Appearance.getColorScheme() : theme;
  const isDark = colorScheme === "dark";

  // Get role-based header color
  const getHeaderColor = () => {
    switch (role) {
      case "student":
        return "#3B82F6";
      case "teacher":
        return "#10B981";
      case "parent":
        return "#F59E0B";
      case "admin":
        return "#8B5CF6";
      default:
        return "#3B82F6";
    }
  };

  // Check if tab should be visible based on role
  const shouldShowPayments = role === "parent"; // Hidden for student
  const shouldShowChat =
    role === "teacher" || role === "student" || role === "parent"; // Chat for teacher, student, parent
  const shouldShowContact = false; // Replaced by chat in incidents tab
  const shouldShowSchedule =
    role === "student" ||
    role === "teacher" ||
    role === "parent" ||
    role === "admin";
  const shouldShowClasses =
    role === "student" ||
    role === "teacher" ||
    role === "parent" ||
    role === "admin";
  const shouldShowAdmin = role === "admin";

  // Back button component for admin accessing schedule/classes
  const BackButton = () => (
    <TouchableOpacity
      onPress={() => router.replace("/(tabs)/admin")}
      style={{ marginLeft: 8, padding: 8 }}
    >
      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: getHeaderColor(),
        tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#9CA3AF",
        tabBarStyle: {
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
          borderTopWidth: 0,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          paddingTop: 12,
          height: Platform.OS === "ios" ? 88 : 72,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerStyle: {
          backgroundColor: getHeaderColor(),
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },
        headerTitleAlign: "center",
      }}
    >
      {/* Home - visible for all except admin */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          headerTitle: "Giáo dục Trường Thành",
          href: role === "admin" ? null : "/(tabs)",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Admin Dashboard - visible for admin only, placed before schedule for admin tab order */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Quản lý",
          headerShown: false,
          href: shouldShowAdmin ? "/(tabs)/admin" : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Schedule - visible for student, teacher, parent, admin */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: role === "teacher" ? "Lịch dạy" : "Lịch học",
          headerTitle: role === "teacher" ? "Lịch dạy" : "Lịch học",
          href: shouldShowSchedule ? "/(tabs)/schedule" : null,
          headerLeft: role === "admin" ? () => <BackButton /> : undefined,
          // tabBarStyle removed to keep tab bar visible
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Classes - visible for student, teacher, parent, admin */}
      <Tabs.Screen
        name="classes"
        options={{
          title: "Lớp học",
          headerTitle: "Lớp học",
          href: null, // Hidden from tab bar as requested
          headerLeft: role === "admin" ? () => <BackButton /> : undefined,
          // Removed tabBarStyle display: none to force tab bar persistence if accessed
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "school" : "school-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Materials - hidden from tab bar, accessible via quick access */}
      <Tabs.Screen
        name="materials"
        options={{
          title: "Tài liệu",
          headerTitle: "Tài liệu học tập",
          href: null,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Contact - visible for student ONLY */}
      <Tabs.Screen
        name="contact"
        options={{
          title: "Liên hệ",
          headerTitle: "Liên hệ",
          href: shouldShowContact ? "/(tabs)/contact" : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Evaluations - hidden from tab bar, accessible via quick action */}
      <Tabs.Screen
        name="evaluations"
        options={{
          title: "Đánh giá",
          headerTitle: role === "teacher" ? "Đánh giá của tôi" : "Đánh giá GV",
          href: null,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "star" : "star-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Payments - visible for parent only (removed for student) */}
      <Tabs.Screen
        name="payments"
        options={{
          title: "Thanh toán",
          headerTitle: "Thanh toán",
          href: shouldShowPayments ? "/(tabs)/payments" : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Chat - visible for teacher, student, parent */}
      <Tabs.Screen
        name="incidents"
        options={{
          title: "Chat",
          headerTitle: "Tin nhắn",
          href: shouldShowChat ? "/(tabs)/incidents" : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Notifications - visible for all */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Thông báo",
          headerTitle: "Thông báo",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "notifications" : "notifications-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Profile - visible for all */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          headerTitle: "Tài khoản",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
