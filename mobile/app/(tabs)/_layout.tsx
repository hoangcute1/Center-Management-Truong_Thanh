import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/stores";
import { View, Platform } from "react-native";

export default function TabsLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user?.role;

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
  const shouldShowPayments = role === "student" || role === "parent";
  const shouldShowIncidents =
    role === "student" || role === "parent" || role === "teacher";
  const shouldShowSchedule =
    role === "student" || role === "teacher" || role === "parent";
  const shouldShowClasses =
    role === "student" || role === "teacher" || role === "parent";
  const shouldShowAdmin = role === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: getHeaderColor(),
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
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
      {/* Home - visible for all */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          headerTitle: "Giáo dục Trường Thành",
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

      {/* Schedule - visible for student, teacher, parent */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: role === "teacher" ? "Lịch dạy" : "Lịch học",
          headerTitle: role === "teacher" ? "Lịch dạy" : "Lịch học",
          href: shouldShowSchedule ? "/(tabs)/schedule" : null,
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

      {/* Classes - visible for student, teacher, parent */}
      <Tabs.Screen
        name="classes"
        options={{
          title: "Lớp học",
          headerTitle: "Lớp học",
          href: shouldShowClasses ? "/(tabs)/classes" : null,
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

      {/* Payments - visible for student, parent only */}
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

      {/* Incidents - visible for student, parent, teacher */}
      <Tabs.Screen
        name="incidents"
        options={{
          title: "Sự cố",
          headerTitle: "Báo cáo sự cố",
          href: shouldShowIncidents ? "/(tabs)/incidents" : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons
                name={focused ? "warning" : "warning-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Admin Dashboard - visible for admin only */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Quản lý",
          headerTitle: "Quản lý hệ thống",
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
