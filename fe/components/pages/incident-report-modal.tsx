"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useIncidentsStore,
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_COLORS,
  INCIDENT_PLATFORM_LABELS,
  type IncidentType,
  type IncidentPlatform,
} from "@/lib/stores/incidents-store";

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userRole: string;
}

export default function IncidentReportModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  userPhone,
  userRole,
}: IncidentReportModalProps) {
  const { createIncident, myIncidents, fetchMyIncidents, isLoading } =
    useIncidentsStore();

  const [activeTab, setActiveTab] = useState<"report" | "history">("report");
  const [type, setType] = useState<IncidentType>("bug_error");
  const [platform, setPlatform] = useState<IncidentPlatform>("web");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMyIncidents().catch(console.error);
    }
  }, [isOpen, fetchMyIncidents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!description.trim()) {
      setError("Vui lòng nhập mô tả sự cố");
      return;
    }

    try {
      await createIncident({
        type,
        platform,
        description: description.trim(),
      });
      setSuccess("Đã gửi báo cáo sự cố thành công!");
      setDescription("");
      setType("bug_error");
      setPlatform("web");
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Có lỗi khi gửi báo cáo");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                🐛
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Báo cáo sự cố</h2>
                <p className="text-orange-100 text-sm">
                  Thông báo lỗi hoặc vấn đề bạn gặp phải
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

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "report"
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("report")}
          >
            📝 Báo cáo mới
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            📋 Lịch sử ({myIncidents.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "report" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-gray-700 text-sm">
                  Thông tin người gửi
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Họ tên:</span>{" "}
                    <span className="font-medium">{userName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{" "}
                    <span className="font-medium">{userEmail}</span>
                  </div>
                  {userPhone && (
                    <div>
                      <span className="text-gray-500">SĐT:</span>{" "}
                      <span className="font-medium">{userPhone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Vai trò:</span>{" "}
                    <span className="font-medium capitalize">
                      {userRole === "student"
                        ? "Học sinh"
                        : userRole === "teacher"
                        ? "Giáo viên"
                        : userRole === "parent"
                        ? "Phụ huynh"
                        : userRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Incident Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại sự cố <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IncidentType)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Object.entries(INCIDENT_TYPE_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nền tảng gặp sự cố
                </label>
                <div className="flex gap-4">
                  {Object.entries(INCIDENT_PLATFORM_LABELS).map(
                    ([value, label]) => (
                      <label key={value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="platform"
                          value={value}
                          checked={platform === value}
                          onChange={(e) =>
                            setPlatform(e.target.value as IncidentPlatform)
                          }
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết sự cố bạn gặp phải... (Vui lòng ghi rõ: bạn đang làm gì, lỗi hiển thị như thế nào, thời điểm xảy ra...)"
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  ❌ {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                  ✅ {success}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl"
              >
                {isLoading ? "Đang gửi..." : "🚀 Gửi báo cáo sự cố"}
              </Button>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {myIncidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">📭</span>
                  <p>Bạn chưa gửi báo cáo sự cố nào</p>
                </div>
              ) : (
                myIncidents.map((incident) => (
                  <div
                    key={incident._id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            INCIDENT_STATUS_COLORS[incident.status]
                          }`}
                        >
                          {INCIDENT_STATUS_LABELS[incident.status]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {INCIDENT_TYPE_LABELS[incident.type]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(incident.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {incident.description}
                    </p>
                    {incident.adminNote && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                        <span className="font-medium">Phản hồi từ Admin:</span>{" "}
                        {incident.adminNote}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
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
