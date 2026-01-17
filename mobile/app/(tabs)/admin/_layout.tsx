import { Stack } from "expo-router";

export default function AdminLayout() {
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
          headerShown: false,
          title: "Quản lý tài khoản",
        }}
      />
      <Stack.Screen
        name="branches"
        options={{
          headerShown: false,
          title: "Quản lý cơ sở",
        }}
      />
      <Stack.Screen
        name="incidents"
        options={{
          headerShown: false,
          title: "Quản lý sự cố",
        }}
      />
      <Stack.Screen
        name="payments"
        options={{
          headerShown: false,
          title: "Quản lý thanh toán",
        }}
      />
      <Stack.Screen
        name="attendance"
        options={{
          headerShown: false,
          title: "Quản lý điểm danh",
        }}
      />
    </Stack>
  );
}
