"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddUserModal from "@/components/pages/add-user-modal";

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
  const [students, setStudents] = useState<User[]>([
    {
      id: "S001",
      fullName: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      phone: "+84 123 456 789",
      role: "student",
      studentId: "HS001",
      parentName: "Nguyễn Văn Anh",
      createdAt: "2025-01-15",
    },
    {
      id: "S002",
      fullName: "Trần Thị B",
      email: "tranthib@email.com",
      phone: "+84 987 654 321",
      role: "student",
      studentId: "HS002",
      parentName: "Trần Thị Bình",
      createdAt: "2025-01-16",
    },
  ]);

  const [parents, setParents] = useState<User[]>([
    {
      id: "P001",
      fullName: "Nguyễn Văn Anh",
      email: "nguyenvanh@email.com",
      phone: "+84 111 222 333",
      role: "parent",
      childrenCount: "2",
      createdAt: "2025-01-10",
    },
  ]);

  const [teachers, setTeachers] = useState<User[]>([
    {
      id: "T001",
      fullName: "Cô Nguyễn Thị C",
      email: "cothic@email.com",
      phone: "+84 444 555 666",
      role: "teacher",
      subject: "Toán",
      experience: "5",
      createdAt: "2025-01-05",
    },
    {
      id: "T002",
      fullName: "Thầy Trần Văn D",
      email: "thayvand@email.com",
      phone: "+84 777 888 999",
      role: "teacher",
      subject: "Anh Văn",
      experience: "8",
      createdAt: "2025-01-05",
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>("student");

  const handleAddUser = (user: User) => {
    if (user.role === "student") setStudents([...students, user]);
    else if (user.role === "parent") setParents([...parents, user]);
    else setTeachers([...teachers, user]);
  };

  const handleDeleteUser = (
    id: string,
    userType: "student" | "parent" | "teacher"
  ) => {
    if (userType === "student")
      setStudents(students.filter((s) => s.id !== id));
    else if (userType === "parent")
      setParents(parents.filter((p) => p.id !== id));
    else setTeachers(teachers.filter((t) => t.id !== id));
  };

  const renderUserTable = (
    users: User[],
    userType: "student" | "parent" | "teacher"
  ) => (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div>
            <p className="font-semibold text-gray-900">{user.fullName}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-600">{user.phone}</p>
            <div className="mt-1 flex gap-2 text-xs text-gray-500">
              <Badge variant="info">{user.id}</Badge>
              {userType === "student" && user.studentId && (
                <Badge variant="success">Mã HS: {user.studentId}</Badge>
              )}
              {userType === "parent" && user.childrenCount && (
                <Badge variant="warning">Con: {user.childrenCount}</Badge>
              )}
              {userType === "teacher" && user.subject && (
                <Badge variant="success">{user.subject}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{user.createdAt}</span>
            <Button
              variant="outline"
              onClick={() => handleDeleteUser(user.id, userType)}
            >
              Xóa
            </Button>
          </div>
        </div>
      ))}
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
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Thêm mới
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
    </div>
  );
}
