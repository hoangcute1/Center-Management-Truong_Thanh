import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AdminLayout() {
  const BackButton = () => (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ marginLeft: 8, padding: 8 }}
    >
      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#8B5CF6",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerBackTitle: "Quay lại",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Admin Dashboard",
        }}
      />
      <Stack.Screen
        name="accounts"
        options={{
          headerShown: true,
          title: "Quản lý tài khoản",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="branches"
        options={{
          headerShown: true,
          title: "Quản lý cơ sở",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="incidents"
        options={{
          headerShown: true,
          title: "Quản lý sự cố",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="payments"
        options={{
          headerShown: true,
          title: "Quản lý thanh toán",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="attendance"
        options={{
          headerShown: true,
          title: "Quản lý điểm danh",
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
