"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddUserModalProps {
  userType: "student" | "parent" | "teacher";
  isOpen: boolean;
  onClose: () => void;
  onAdd: (user: NewUserPayload) => void;
}

type UserType = "student" | "parent" | "teacher";

type BaseForm = {
  fullName: string;
  email: string;
  phone: string;
};

type StudentForm = BaseForm & { studentId: string; parentName: string };
type ParentForm = BaseForm & { childrenCount: string };
type TeacherForm = BaseForm & { subject: string; experience: string };

type FormDataState = StudentForm | ParentForm | TeacherForm;

type NewUserPayload = FormDataState & {
  id: string;
  role: UserType;
  createdAt: string;
};

const BASE_FORM: BaseForm = { fullName: "", email: "", phone: "" };

const getDefaultForm = (userType: UserType): FormDataState => {
  if (userType === "student")
    return { ...BASE_FORM, studentId: "", parentName: "" };
  if (userType === "parent") return { ...BASE_FORM, childrenCount: "1" };
  return { ...BASE_FORM, subject: "", experience: "" };
};

export default function AddUserModal({
  userType,
  isOpen,
  onClose,
  onAdd,
}: AddUserModalProps) {
  const [formData, setFormData] = useState<FormDataState>(() =>
    getDefaultForm(userType)
  );

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: NewUserPayload = {
      id: Math.random().toString(36).slice(2, 9),
      ...formData,
      role: userType,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };
    onAdd(newUser);
    onClose();
  };

  const title =
    userType === "student"
      ? "Thêm học sinh"
      : userType === "parent"
      ? "Thêm phụ huynh"
      : "Thêm giáo viên";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Họ tên</label>
            <Input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {userType === "student" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Mã học sinh
                </label>
                <Input
                  name="studentId"
                  value={"studentId" in formData ? formData.studentId : ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tên phụ huynh
                </label>
                <Input
                  name="parentName"
                  value={"parentName" in formData ? formData.parentName : ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {userType === "parent" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Số con
              </label>
              <Input
                name="childrenCount"
                value={
                  "childrenCount" in formData ? formData.childrenCount : ""
                }
                onChange={handleChange}
              />
            </div>
          )}

          {userType === "teacher" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Môn dạy
                </label>
                <Input
                  name="subject"
                  value={"subject" in formData ? formData.subject : ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Kinh nghiệm (năm)
                </label>
                <Input
                  name="experience"
                  value={"experience" in formData ? formData.experience : ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Lưu
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
