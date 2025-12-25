"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginPageProps {
  onLogin: (user: {
    id: string;
    name: string;
    email: string;
    role: "student" | "teacher" | "parent" | "admin";
    branchId?: string;
    branchName?: string;
  }) => void;
}

const DEMO_USERS = {
  student: { id: "st1", name: "Nguyễn Văn A", email: "student@example.com" },
  teacher: { id: "te1", name: "Trần Thị B", email: "teacher@example.com" },
  parent: { id: "pa1", name: "Lê Văn C", email: "parent@example.com" },
  admin: { id: "ad1", name: "Phạm Quốc D", email: "admin@example.com" },
};

const BRANCHES = [
  { id: "cs1", name: "Cơ sở 1 - Quận 1" },
  { id: "cs2", name: "Cơ sở 2 - Quận 3" },
  { id: "cs3", name: "Cơ sở 3 - Thủ Đức" },
];

type Role = "student" | "teacher" | "parent" | "admin";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("cs1");

  const handleDemoLogin = (role: Role) => {
    const user = DEMO_USERS[role];
    const branch = BRANCHES.find((b) => b.id === branchId);
    onLogin({ ...user, role, branchId, branchName: branch?.name });
  };

  const handleCustomLogin = () => {
    if (selectedRole && email) {
      const branch = BRANCHES.find((b) => b.id === branchId);
      onLogin({
        id: `${selectedRole}-${Date.now()}`,
        name: email.split("@")[0],
        email,
        role: selectedRole,
        branchId,
        branchName: branch?.name,
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden flex items-center justify-center p-4">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        radial-gradient(circle 600px at 0% 200px, #bfdbfe, transparent),
        radial-gradient(circle 600px at 100% 200px, #bfdbfe, transparent)
      `,
        }}
      />
      <div className="w-full max-w-md relative z-10">
        <Card className="backdrop-blur-md bg-white/95 border-white/20 shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trường Thành Education
            </h1>
            <p className="text-gray-600">Hệ thống quản lý trung tâm dạy thêm</p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Đăng nhập Demo
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(["student", "teacher", "parent", "admin"] as const).map(
                  (role) => (
                    <Button
                      key={role}
                      onClick={() => handleDemoLogin(role)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {role === "student" && "Học sinh"}
                      {role === "teacher" && "Giáo viên"}
                      {role === "parent" && "Phụ huynh"}
                      {role === "admin" && "Admin"}
                    </Button>
                  )
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Hoặc đăng nhập bằng email
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Chọn cơ sở
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  {BRANCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Chọn vai trò
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                >
                  <option value="">-- Chọn --</option>
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="parent">Phụ huynh</option>
                  <option value="admin">Quản trị</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Nhập email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCustomLogin}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Đăng nhập
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
