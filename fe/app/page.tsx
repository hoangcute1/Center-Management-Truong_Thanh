"use client";

import { useState } from "react";
import LoginPage from "@/components/pages/login-page";
import StudentDashboard from "@/components/dashboards/student-dashboard";
import TeacherDashboard from "@/components/dashboards/teacher-dashboard";
import ParentDashboard from "@/components/dashboards/parent-dashboard";
import AdminDashboard from "@/components/dashboards/admin-dashboard";

type UserRole = "student" | "teacher" | "parent" | "admin" | null;

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <div>
      {currentUser.role === "student" && (
        <StudentDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === "teacher" && (
        <TeacherDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === "parent" && (
        <ParentDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === "admin" && (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
