"use client";

import { useEffect, useState } from "react";
import LoginPage from "@/components/pages/login-page";
import StudentDashboard from "@/components/dashboards/student-dashboard";
import TeacherDashboard from "@/components/dashboards/teacher-dashboard";
import ParentDashboard from "@/components/dashboards/parent-dashboard";
import AdminDashboard from "@/components/dashboards/admin-dashboard";
import { useAuthStore } from "@/lib/stores/auth-store";

type UserRole = "student" | "teacher" | "parent" | "admin" | null;

export default function Home() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for zustand hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Show loading while hydrating
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Map user to the format dashboards expect
  const currentUser = {
    id: user._id || user.id || "",
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };

  return (
    <div>
      {user.role === "student" && (
        <StudentDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {user.role === "teacher" && (
        <TeacherDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {user.role === "parent" && (
        <ParentDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {user.role === "admin" && (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
