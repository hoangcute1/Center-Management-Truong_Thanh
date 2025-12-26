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

const ROLE_CONFIG = {
  student: {
    label: "Học sinh",
    icon: "🎓",
    color: "from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
  },
  teacher: {
    label: "Giáo viên",
    icon: "👨‍🏫",
    color: "from-emerald-500 to-emerald-600",
    hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
  },
  parent: {
    label: "Phụ huynh",
    icon: "👪",
    color: "from-amber-500 to-orange-500",
    hoverColor: "hover:from-amber-600 hover:to-orange-600",
  },
  admin: {
    label: "Quản trị",
    icon: "⚙️",
    color: "from-purple-500 to-purple-600",
    hoverColor: "hover:from-purple-600 hover:to-purple-700",
  },
};

type Role = "student" | "teacher" | "parent" | "admin";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("cs1");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async (role: Role) => {
    setIsLoading(true);
    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = DEMO_USERS[role];
    const branch = BRANCHES.find((b) => b.id === branchId);
    onLogin({ ...user, role, branchId, branchName: branch?.name });
    setIsLoading(false);
  };

  const handleCustomLogin = async () => {
    if (selectedRole && email) {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const branch = BRANCHES.find((b) => b.id === branchId);
      onLogin({
        id: `${selectedRole}-${Date.now()}`,
        name: email.split("@")[0],
        email,
        role: selectedRole,
        branchId,
        branchName: branch?.name,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col lg:flex-row">
      {/* Mobile Header - Gradient Banner */}
      <div className="lg:hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 py-8 text-white text-center relative overflow-hidden">
        {/* Animated background shapes for mobile */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-xl font-bold">Trường Thành Education</h1>
          <p className="text-sm text-blue-100 mt-1">
            Hệ thống quản lý trung tâm dạy thêm
          </p>
        </div>
      </div>

      {/* Left side - Decorative (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <span className="text-4xl">🎓</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Trường Thành Education</h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Hệ thống quản lý trung tâm dạy thêm thông minh, kết nối học sinh -
              giáo viên - phụ huynh.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <p className="font-semibold">Quản lý lớp học</p>
                <p className="text-sm text-blue-200">
                  Theo dõi tiến độ học tập dễ dàng
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="font-semibold">Liên lạc trực tiếp</p>
                <p className="text-sm text-blue-200">
                  Chat với giáo viên mọi lúc
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="font-semibold">Báo cáo chi tiết</p>
                <p className="text-sm text-blue-200">
                  Điểm số, điểm danh, học phí
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md">
          <Card className="bg-white border-0 shadow-xl shadow-blue-100/50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
            <div className="text-center mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Chào mừng trở lại! 👋
              </h2>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Đăng nhập để tiếp tục
              </p>
            </div>

            {/* Demo Login Buttons */}
            <div className="mb-5 sm:mb-6">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                  ⚡
                </span>
                Đăng nhập nhanh (Demo)
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 sm:gap-3">
                {(["student", "teacher", "parent", "admin"] as const).map(
                  (role) => {
                    const config = ROLE_CONFIG[role];
                    return (
                      <button
                        key={role}
                        onClick={() => handleDemoLogin(role)}
                        disabled={isLoading}
                        className={`
                          relative group p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${config.color} ${config.hoverColor}
                          text-white font-medium transition-all duration-300
                          hover:shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5
                          disabled:opacity-50 disabled:cursor-not-allowed
                          active:scale-95
                        `}
                      >
                        <span className="text-xl sm:text-2xl block mb-0.5 sm:mb-1">
                          {config.icon}
                        </span>
                        <span className="text-[10px] sm:text-sm leading-tight">
                          {config.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 sm:px-4 text-xs sm:text-sm text-gray-400">
                  hoặc đăng nhập bằng email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <div className="space-y-3 sm:space-y-4">
              {/* Branch & Role in one row on mobile */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-4">
                {/* Branch Select */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2">
                    <span>🏫</span>{" "}
                    <span className="hidden sm:inline">Cơ sở</span>
                    <span className="sm:hidden">Cơ sở</span>
                  </label>
                  <select
                    className="w-full rounded-lg sm:rounded-xl border-2 border-gray-100 bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm 
                      focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
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

                {/* Role Select */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2">
                    <span>👤</span> <span>Vai trò</span>
                  </label>
                  <select
                    className="w-full rounded-lg sm:rounded-xl border-2 border-gray-100 bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm 
                      focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                  >
                    <option value="">-- Chọn --</option>
                    <option value="student">🎓 Học sinh</option>
                    <option value="teacher">👨‍🏫 Giáo viên</option>
                    <option value="parent">👪 Phụ huynh</option>
                    <option value="admin">⚙️ Quản trị</option>
                  </select>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2">
                  <span>✉️</span> Email
                </label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg sm:rounded-xl border-2 border-gray-100 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm 
                    focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2">
                  <span>🔒</span> Mật khẩu
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg sm:rounded-xl border-2 border-gray-100 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-xs sm:text-sm 
                      focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm sm:text-base"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">Ghi nhớ</span>
                </label>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Quên mật khẩu?
                </button>
              </div>

              {/* Login Button */}
              <Button
                onClick={handleCustomLogin}
                disabled={isLoading || !selectedRole || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                  text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-lg shadow-blue-200/50 
                  transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                  active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Đang đăng nhập...
                  </span>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500">
                Chưa có tài khoản?{" "}
                <button className="text-blue-600 hover:text-blue-700 font-semibold">
                  Liên hệ Admin
                </button>
              </p>
            </div>
          </Card>

          {/* Copyright */}
          <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-4 sm:mt-6">
            © 2025 Trường Thành Education. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
