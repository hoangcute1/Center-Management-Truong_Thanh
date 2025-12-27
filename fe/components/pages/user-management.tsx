"use client";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddUserModal from "@/components/pages/add-user-modal";
import ImportUsersModal from "@/components/pages/import-users-modal";
import { useUsersStore, ImportResponse } from "@/lib/stores/users-store";
import { useBranchesStore } from "@/lib/stores/branches-store";

type UserType = "student" | "parent" | "teacher";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserType;
  createdAt: string;
  studentId?: string;
  parentName?: string;
  childrenCount?: string;
  subject?: string;
  experience?: string;
}

export default function UserManagement() {
  // Zustand stores
  const {
    users,
    fetchUsers,
    deleteUser,
    importUsers,
    downloadTemplate,
    isLoading,
  } = useUsersStore();
  const { branches, fetchBranches } = useBranchesStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>("student");

  // Fetch data on mount
  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  // Filter users by role
  const students = users.filter((u) => u.role === "student");
  const parents = users.filter((u) => u.role === "parent");
  const teachers = users.filter((u) => u.role === "teacher");

  const handleAddUser = (user: User) => {
    // This will be handled by the modal through API
    fetchUsers(); // Refresh list
  };

  const handleDeleteUser = async (
    id: string,
    userType: "student" | "parent" | "teacher"
  ) => {
    if (confirm("Bạn có chắc muốn xóa người dùng này?")) {
      try {
        await deleteUser(id);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleImportUsers = async (
    file: File,
    role: UserType,
    branchId: string
  ): Promise<ImportResponse> => {
    return await importUsers(file, role, branchId);
  };

  const handleDownloadTemplate = (role: UserType) => {
    downloadTemplate(role);
  };

  const renderUserTable = (
    users: any[],
    userType: "student" | "parent" | "teacher"
  ) => (
    <div className="space-y-3">
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <span className="animate-spin inline-block mr-2">⏳</span>
          Đang tải...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Chưa có dữ liệu</div>
      ) : (
        users.map((user) => (
          <div
            key={user._id || user.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div>
              <p className="font-semibold text-gray-900">
                {user.name || user.fullName}
              </p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-600">{user.phone}</p>
              <div className="mt-1 flex gap-2 text-xs text-gray-500">
                <Badge variant="info">{user._id?.slice(-6) || user.id}</Badge>
                {user.status && (
                  <Badge
                    variant={user.status === "active" ? "success" : "warning"}
                  >
                    {user.status}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : ""}
              </span>
              <Button
                variant="outline"
                onClick={() => handleDeleteUser(user._id || user.id, userType)}
              >
                Xóa
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Quản lý người dùng</p>
          <p className="text-xl font-semibold text-gray-900">
            Học sinh • Phụ huynh • Giáo viên
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={selectedUserType}
            onChange={(e) => setSelectedUserType(e.target.value as UserType)}
          >
            <option value="student">Học sinh</option>
            <option value="parent">Phụ huynh</option>
            <option value="teacher">Giáo viên</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            📤 Import Excel
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            ➕ Thêm mới
          </Button>
        </div>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList>
          <TabsTrigger value="students">
            Học sinh ({students.length})
          </TabsTrigger>
          <TabsTrigger value="parents">
            Phụ huynh ({parents.length})
          </TabsTrigger>
          <TabsTrigger value="teachers">
            Giáo viên ({teachers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          {renderUserTable(students, "student")}
        </TabsContent>
        <TabsContent value="parents">
          {renderUserTable(parents, "parent")}
        </TabsContent>
        <TabsContent value="teachers">
          {renderUserTable(teachers, "teacher")}
        </TabsContent>
      </Tabs>

      <AddUserModal
        key={selectedUserType}
        userType={selectedUserType}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddUser}
      />

      <ImportUsersModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        branches={branches}
        onImport={handleImportUsers}
        onDownloadTemplate={handleDownloadTemplate}
      />
    </div>
  );
}
