"use client";
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Class } from "@/lib/stores/classes-store";
import { Branch } from "@/lib/stores/branches-store";
import api from "@/lib/api";

interface ImportStudentsModalProps {
  classes: Class[];
  branches: Branch[];
  onClose: () => void;
  onSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  row: number;
  email?: string;
  name?: string;
  error?: string;
  tempPassword?: string;
}

interface ImportResponse {
  total: number;
  successful: number;
  failed: number;
  results: ImportResult[];
  classId?: string;
}

export default function ImportStudentsModal({
  classes,
  branches,
  onClose,
  onSuccess,
}: ImportStudentsModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter classes by selected branch - handle both string and object branchId
  const filteredClasses = selectedBranchId
    ? classes.filter((c) => {
        // branchId can be string or object {_id, name}
        const classBranchId =
          typeof c.branchId === "object" && c.branchId
            ? (c.branchId as any)._id
            : c.branchId;
        return classBranchId === selectedBranchId;
      })
    : classes;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/imports/template?role=student", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `template_student_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading template:", err);
      setError("Không thể tải template");
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Vui lòng chọn file");
      return;
    }
    if (!selectedBranchId) {
      setError("Vui lòng chọn cơ sở");
      return;
    }
    if (!selectedClassId) {
      setError("Vui lòng chọn lớp học");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("role", "student");
      formData.append("branchId", selectedBranchId);
      formData.append("classId", selectedClassId);

      const response = await api.post("/imports/users", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
      if (response.data.successful > 0) {
        onSuccess?.();
      }
    } catch (err: any) {
      console.error("Error importing:", err);
      setError(err.response?.data?.message || "Lỗi khi import học sinh");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 bg-white shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg">
            📥
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Import học sinh vào lớp
            </h3>
            <p className="text-sm text-gray-500">
              Upload file Excel danh sách học sinh và chọn lớp
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Result Summary */}
        {result && (
          <div className="mb-4 p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Kết quả Import</h4>
            <div className="grid grid-cols-3 gap-4 text-center mb-3">
              <div className="p-2 bg-blue-100 rounded">
                <div className="text-2xl font-bold text-blue-700">
                  {result.total}
                </div>
                <div className="text-xs text-blue-600">Tổng</div>
              </div>
              <div className="p-2 bg-green-100 rounded">
                <div className="text-2xl font-bold text-green-700">
                  {result.successful}
                </div>
                <div className="text-xs text-green-600">Thành công</div>
              </div>
              <div className="p-2 bg-red-100 rounded">
                <div className="text-2xl font-bold text-red-700">
                  {result.failed}
                </div>
                <div className="text-xs text-red-600">Thất bại</div>
              </div>
            </div>

            {/* Show success details */}
            {result.results.filter((r) => r.success).length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-green-700 mb-1">
                  ✅ Đã thêm vào lớp {selectedClass?.name}:
                </h5>
                <div className="max-h-32 overflow-y-auto bg-green-50 rounded p-2">
                  {result.results
                    .filter((r) => r.success)
                    .map((r, idx) => (
                      <div key={idx} className="text-xs text-green-800 py-0.5">
                        • {r.name} ({r.email}) - MK: {r.tempPassword}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Show failed details */}
            {result.results.filter((r) => !r.success).length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-red-700 mb-1">
                  ❌ Lỗi:
                </h5>
                <div className="max-h-32 overflow-y-auto bg-red-50 rounded p-2">
                  {result.results
                    .filter((r) => !r.success)
                    .map((r, idx) => (
                      <div key={idx} className="text-xs text-red-800 py-0.5">
                        • Dòng {r.row}: {r.error}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {!result && (
          <div className="space-y-4">
            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cơ sở <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setSelectedClassId(""); // Reset class when branch changes
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Chọn cơ sở --</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lớp học <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={!selectedBranchId}
                className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  !selectedBranchId ? "bg-gray-100" : ""
                }`}
              >
                <option value="">
                  {selectedBranchId
                    ? "-- Chọn lớp học --"
                    : "-- Chọn cơ sở trước --"}
                </option>
                {filteredClasses.map((c) => (
                  <option key={c._id} value={c._id}>
                    📚 {c.name} ({c.studentIds?.length || 0} học sinh)
                  </option>
                ))}
              </select>
              {selectedClass && (
                <p className="text-xs text-gray-500 mt-1">
                  Hiện có {selectedClass.studentIds?.length || 0} học sinh trong
                  lớp
                </p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Excel <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-xl"
                >
                  📁 {file ? file.name : "Chọn file..."}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  📥 Template
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Hỗ trợ: .xlsx, .xls, .csv (Tối đa 5MB)
              </p>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                📌 Hướng dẫn:
              </h4>
              <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
                <li>Tải template Excel bằng nút "Template"</li>
                <li>Điền thông tin học sinh vào template</li>
                <li>Chọn cơ sở và lớp học</li>
                <li>Upload file và nhấn "Import"</li>
                <li>Mật khẩu mặc định: 123456789</li>
              </ol>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {!result ? (
            <>
              <Button
                onClick={handleImport}
                disabled={isLoading || !file || !selectedClassId}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Đang import...
                  </>
                ) : (
                  "📥 Import học sinh"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
              >
                Hủy
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              Đóng
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
