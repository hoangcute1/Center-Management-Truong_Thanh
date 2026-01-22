"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAuthStore,
  forgotPassword,
  contactAdmin,
  validateLogin,
} from "@/lib/stores/auth-store";
import { useBranchesStore, type Branch } from "@/lib/stores/branches-store";
import { toasts } from "@/components/ui/toast"
import { Bounce, ToastContainer, toast } from "react-toastify";

interface LoginPageProps {
  onLogin?: (user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "student" | "teacher" | "parent" | "admin";
    branchId?: string;
    branchName?: string;
    studentCode: string;
    dateOfBirth: Date;
    gender: string;
  }) => void;
}

// Demo users để test nhanh - Tài khoản demo thật từ database
const DEMO_USERS = {
  student: {
    email: "student.an@truongthanh.edu.vn",
    password: "123456",
    name: "Nguyễn Văn An",
    code: "HS0001",
  },
  teacher: {
    email: "teacher.binh@truongthanh.edu.vn",
    password: "123456",
    name: "Trần Thị Bình",
    code: "GV0001",
  },
  parent: {
    email: "parent.hung@truongthanh.edu.vn",
    password: "123456",
    name: "Nguyễn Văn Hùng",
    code: "PH0001",
  },
  admin: {
    email: "admin@truongthanh.edu.vn",
    password: "123456",
    name: "Admin Trường Thành",
    code: "ADMIN",
  },
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

// Modal types
type ModalType = "forgot-password" | "contact-admin" | null;

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Contact admin form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactType, setContactType] = useState<
    "register" | "support" | "other"
  >("register");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Zustand stores
  const {
    login,
    isAuthenticated,
    user,
    isLoading: authLoading,
  } = useAuthStore();
  const { branches, fetchBranches } = useBranchesStore();

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches().catch(console.error);
  }, [fetchBranches]);

  // Set default branchId when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && !branchId) {
      setBranchId(branches[0]._id);
    }
  }, [branches, branchId]);

  // Get actual branches or fallback to demo branches
  const displayBranches =
    branches.length > 0
      ? branches.map((b) => ({ id: b._id, name: b.name }))
      : BRANCHES;

  // Handle real API login
  const handleLogin = async (
    loginEmail: string,
    loginPassword: string,
    loginRole?: Role
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate role and branch before login if role is selected
      if (loginRole && branchId) {
        const validation = await validateLogin({
          email: loginEmail,
          role: loginRole,
          branchId: branchId,
        });

        if (
          !validation.valid &&
          validation.errors &&
          validation.errors.length > 0
        ) {
          setError(validation.errors.join("\n"));
          toast.error(validation.errors[0]);
          setIsLoading(false);
          return;
        }
      }

      const userData = await login(loginEmail, loginPassword);

      // Verify role matches if selected
      if (loginRole && userData.role !== loginRole) {
        setError(
          `Vai trò không đúng. Tài khoản này có vai trò "${ROLE_CONFIG[userData.role as Role]?.label || userData.role
          }".`
        );
        toast.error("Vai trò không đúng!", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
        setIsLoading(false);
        return;
      }

      // Verify branch matches (except for admin)
      if (
        userData.role !== "admin" &&
        branchId &&
        userData.branchId &&
        userData.branchId !== branchId
      ) {
        setError("Cơ sở không đúng. Vui lòng chọn đúng cơ sở của bạn.");
        toast.error("Cơ sở không đúng!", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
        setIsLoading(false);
        return;
      }

      // Show success toast
      toast.success(`Chào mừng ${userData.name}!`, {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });

      // If onLogin callback exists (for backward compatibility)
      if (onLogin && userData) {
        const branch = displayBranches.find((b) => b.id === userData.branchId);
        onLogin({
          id: userData._id || userData.id || "",
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role as Role,
          branchId: userData.branchId,
          branchName: branch?.name,
          studentCode: userData.studentCode,
          dateOfBirth: userData.dateOfBirth,
          gender: userData.gender,
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: Role) => {
    const demoUser = DEMO_USERS[role];
    await handleLogin(demoUser.email, demoUser.password, role);
  };

  const handleCustomLogin = async () => {
    if (!selectedRole) {
      setError("Vui lòng chọn vai trò trước khi đăng nhập.");
      toast.error("Vui lòng chọn vai trò!");
      return;
    }
    if (!branchId && selectedRole !== "admin") {
      setError("Vui lòng chọn cơ sở trước khi đăng nhập.");
      toast.error("Vui lòng chọn cơ sở!");
      return;
    }
    if (email && password) {
      await handleLogin(email, password, selectedRole);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error("Vui lòng nhập email!");
      return;
    }
    setForgotLoading(true);
    try {
      const result = await forgotPassword(forgotEmail);
      setForgotSuccess(true);
      toast.success(result.message);
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra!");
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle contact admin
  const handleContactAdmin = async () => {
    if (!contactName || !contactEmail || !contactMessage) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    setContactLoading(true);
    try {
      const result = await contactAdmin({
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        message: contactMessage,
        type: contactType,
      });
      setContactSuccess(true);
      toast.success(result.message);
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra!");
    } finally {
      setContactLoading(false);
    }
  };

  // Reset modal state
  const closeModal = () => {
    setActiveModal(null);
    setForgotEmail("");
    setForgotSuccess(false);
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactMessage("");
    setContactType("register");
    setContactSuccess(false);
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

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Demo Login Buttons */}
            <div className="mb-5 sm:mb-6">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                  ⚡
                </span>
                Đăng nhập nhanh (Demo) - Mật khẩu: 123456
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                {(["student", "teacher", "parent", "admin"] as const).map(
                  (role) => {
                    const config = ROLE_CONFIG[role];
                    const demoInfo = DEMO_USERS[role];
                    return (
                      <button
                        key={role}
                        onClick={() => handleDemoLogin(role)}
                        disabled={isLoading}
                        title={`${demoInfo.name}\n${demoInfo.email}\nMã: ${demoInfo.code}`}
                        className={`
                          relative group p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r ${config.color} ${config.hoverColor}
                          text-white font-medium transition-all duration-300
                          hover:shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5
                          disabled:opacity-50 disabled:cursor-not-allowed
                          active:scale-95
                        `}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl">
                            {config.icon}
                          </span>
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-xs sm:text-sm font-semibold block">
                              {config.label}
                            </span>
                            <span className="text-[9px] sm:text-[10px] opacity-80 block truncate">
                              {demoInfo.code}
                            </span>
                          </div>
                        </div>
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
                    {displayBranches.map((b) => (
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
                <button
                  type="button"
                  onClick={() => setActiveModal("forgot-password")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Login Button */}
              <Button
                onClick={handleCustomLogin}
                disabled={
                  isLoading ||
                  !email ||
                  !password ||
                  !selectedRole ||
                  (!branchId && selectedRole !== "admin")
                }
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
                <button
                  type="button"
                  onClick={() => setActiveModal("contact-admin")}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
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

      {/* Forgot Password Modal */}
      {activeModal === "forgot-password" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                    🔐
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Quên mật khẩu
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Yêu cầu đặt lại mật khẩu
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {forgotSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✅</span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    Yêu cầu đã được gửi!
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Admin sẽ liên hệ với bạn qua email hoặc số điện thoại đăng
                    ký để hỗ trợ đặt lại mật khẩu.
                  </p>
                  <Button
                    onClick={closeModal}
                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                  >
                    Đóng
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    Nhập email đăng ký tài khoản. Admin sẽ liên hệ để hỗ trợ bạn
                    đặt lại mật khẩu.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                        <span>✉️</span> Email
                      </label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={closeModal}
                        className="flex-1 rounded-xl"
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleForgotPassword}
                        disabled={forgotLoading || !forgotEmail}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                      >
                        {forgotLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Admin Modal */}
      {activeModal === "contact-admin" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                    📞
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Liên hệ Admin
                    </h2>
                    <p className="text-purple-100 text-sm">
                      Gửi yêu cầu hỗ trợ
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {contactSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✅</span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    Yêu cầu đã được gửi!
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Admin sẽ liên hệ lại với bạn sớm nhất có thể. Cảm ơn bạn đã
                    quan tâm!
                  </p>
                  <Button
                    onClick={closeModal}
                    className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl"
                  >
                    Đóng
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Contact Type */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <span>📋</span> Loại yêu cầu
                    </label>
                    <select
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value as any)}
                      className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="register">🎓 Đăng ký tài khoản mới</option>
                      <option value="support">🛠️ Hỗ trợ kỹ thuật</option>
                      <option value="other">💬 Khác</option>
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <span>👤</span> Họ tên{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <span>✉️</span> Email{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <span>📱</span> Số điện thoại
                    </label>
                    <Input
                      type="tel"
                      placeholder="0901234567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <span>💬</span> Nội dung{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder={
                        contactType === "register"
                          ? "Tôi muốn đăng ký tài khoản cho con/em tôi học tại cơ sở..."
                          : "Mô tả chi tiết vấn đề của bạn..."
                      }
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={closeModal}
                      className="flex-1 rounded-xl"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleContactAdmin}
                      disabled={
                        contactLoading ||
                        !contactName ||
                        !contactEmail ||
                        !contactMessage
                      }
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl"
                    >
                      {contactLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
