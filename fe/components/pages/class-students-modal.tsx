"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClassesStore, type Class } from "@/lib/stores/classes-store";
import { useUsersStore } from "@/lib/stores/users-store";

interface ClassStudentsModalProps {
  classData: Class;
  branchId?: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ClassStudentsModal({
  classData,
  branchId,
  onClose,
  onUpdate,
}: ClassStudentsModalProps) {
  const { addStudentToClass, removeStudentFromClass, isLoading } =
    useClassesStore();
  const { users, fetchUsers } = useUsersStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get current students in class
  const currentStudents = classData.students || [];
  const currentStudentIds = classData.studentIds || [];

  // Get all students from the same branch that are not in this class
  const availableStudents = useMemo(() => {
    const students = users.filter((u) => u.role === "student");
    const branchStudents = branchId
      ? students.filter((s) => s.branchId === branchId)
      : students;
    return branchStudents.filter((s) => !currentStudentIds.includes(s._id));
  }, [users, branchId, currentStudentIds]);

  // Filter students by search query
  const filteredCurrentStudents = useMemo(() => {
    if (!searchQuery.trim()) return currentStudents;
    const query = searchQuery.toLowerCase();
    return currentStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
    );
  }, [currentStudents, searchQuery]);

  const filteredAvailableStudents = useMemo(() => {
    if (!searchQuery.trim()) return availableStudents;
    const query = searchQuery.toLowerCase();
    return availableStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
    );
  }, [availableStudents, searchQuery]);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers({ role: "student" }).catch(console.error);
  }, [fetchUsers]);

  // Handle add student
  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      setError("Vui lòng chọn học sinh");
      return;
    }

    setError(null);
    try {
      await addStudentToClass(classData._id, selectedStudentId);
      setSuccessMessage("Đã thêm học sinh vào lớp!");
      setSelectedStudentId("");
      setShowAddStudent(false);
      onUpdate();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Có lỗi khi thêm học sinh");
    }
  };

  // Handle remove student
  const handleRemoveStudent = async (
    studentId: string,
    studentName: string
  ) => {
    if (
      !confirm(
        `Bạn có chắc muốn xóa "${studentName}" khỏi lớp này?\n\nHọc sinh sẽ không còn xem được lịch học của lớp này.`
      )
    ) {
      return;
    }

    setError(null);
    try {
      await removeStudentFromClass(classData._id, studentId);
      setSuccessMessage("Đã xóa học sinh khỏi lớp!");
      onUpdate();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Có lỗi khi xóa học sinh");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                👥
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Danh sách học sinh
                </h2>
                <p className="text-blue-100 text-sm">
                  {classData.name} • {currentStudentIds.length}/
                  {classData.maxStudents || 30} học sinh
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              ✅ {successMessage}
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <Input
                type="text"
                placeholder="Tìm kiếm học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <Button
              onClick={() => setShowAddStudent(!showAddStudent)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
            >
              ➕ Thêm học sinh
            </Button>
          </div>

          {/* Add Student Form */}
          {showAddStudent && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="font-semibold text-blue-800 mb-3">
                Thêm học sinh vào lớp
              </h4>
              <div className="flex gap-2">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn học sinh --</option>
                  {filteredAvailableStudents.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleAddStudent}
                  disabled={isLoading || !selectedStudentId}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Đang thêm..." : "Thêm"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddStudent(false);
                    setSelectedStudentId("");
                  }}
                  className="rounded-xl"
                >
                  Hủy
                </Button>
              </div>
              {availableStudents.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Không còn học sinh nào có thể thêm vào lớp này
                </p>
              )}
            </div>
          )}

          {/* Students List */}
          <div className="space-y-2">
            {filteredCurrentStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <span className="text-5xl mb-4 block">👥</span>
                <p className="font-medium">
                  {currentStudents.length === 0
                    ? "Chưa có học sinh trong lớp"
                    : "Không tìm thấy học sinh"}
                </p>
                <p className="text-sm mt-1">
                  {currentStudents.length === 0
                    ? "Nhấn 'Thêm học sinh' để thêm"
                    : "Thử tìm kiếm với từ khóa khác"}
                </p>
              </div>
            ) : (
              filteredCurrentStudents.map((student, index) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-200 hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-lg">
                      👨‍🎓
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {index + 1}. {student.name}
                      </p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() =>
                      handleRemoveStudent(student._id, student.name)
                    }
                    disabled={isLoading}
                  >
                    🗑️ Xóa
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Tổng số học sinh: <strong>{currentStudentIds.length}</strong>
              </span>
              <span>
                Còn trống:{" "}
                <strong>
                  {(classData.maxStudents || 30) - currentStudentIds.length}
                </strong>{" "}
                chỗ
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full rounded-xl"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
