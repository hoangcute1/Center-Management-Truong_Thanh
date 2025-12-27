"use client";
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserRole = "student" | "teacher" | "parent";

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
}

interface Branch {
  _id: string;
  name: string;
}

interface ImportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  onImport: (
    file: File,
    role: UserRole,
    branchId: string
  ) => Promise<ImportResponse>;
  onDownloadTemplate: (role: UserRole) => void;
}

const roleLabels: Record<UserRole, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
};

export default function ImportUsersModal({
  isOpen,
  onClose,
  branches,
  onImport,
  onDownloadTemplate,
}: ImportUsersModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];
      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(xlsx|xls|csv)$/i)
      ) {
        setError("Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV");
        return;
      }
      setSelectedFile(file);
      setError(null);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn file");
      return;
    }
    if (!selectedBranch) {
      setError("Vui lòng chọn cơ sở");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onImport(selectedFile, selectedRole, selectedBranch);
      setImportResult(result);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi import");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    setError(null);
    setSelectedRole("student");
    setSelectedBranch("");
    onClose();
  };

  const handleDownloadResults = () => {
    if (!importResult) return;

    // Tạo CSV content từ kết quả
    const headers = [
      "Dòng",
      "Họ tên",
      "Email",
      "Trạng thái",
      "Mật khẩu tạm",
      "Lỗi",
    ];
    const rows = importResult.results.map((r) => [
      r.row,
      r.name || "",
      r.email || "",
      r.success ? "Thành công" : "Thất bại",
      r.tempPassword || "",
      r.error || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ket_qua_import_${selectedRole}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            📤 Import người dùng từ Excel/CSV
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {!importResult ? (
          <>
            {/* Step 1: Chọn loại người dùng */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Chọn loại người dùng
                </label>
                <div className="flex gap-2">
                  {(["student", "teacher", "parent"] as UserRole[]).map(
                    (role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                          selectedRole === role
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {role === "student" && "👨‍🎓 "}
                        {role === "teacher" && "👩‍🏫 "}
                        {role === "parent" && "👨‍👩‍👧 "}
                        {roleLabels[role]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Step 2: Chọn cơ sở */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Chọn cơ sở
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">-- Chọn cơ sở --</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Tải template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Tải file mẫu (Template)
                </label>
                <Button
                  variant="outline"
                  onClick={() => onDownloadTemplate(selectedRole)}
                  className="w-full"
                >
                  📥 Tải template {roleLabels[selectedRole]}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Tải file mẫu, điền thông tin và upload lại
                </p>
              </div>

              {/* Step 4: Upload file */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4. Upload file đã điền
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="text-green-600">
                      <span className="text-3xl">✅</span>
                      <p className="font-medium mt-2">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <span className="text-3xl">📁</span>
                      <p className="mt-2">
                        Click để chọn file hoặc kéo thả vào đây
                      </p>
                      <p className="text-sm">
                        Hỗ trợ: .xlsx, .xls, .csv (tối đa 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleImport}
                disabled={!selectedFile || !selectedBranch || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Đang import...
                  </>
                ) : (
                  <>📤 Import</>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Import Result */
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {importResult.total}
                </p>
                <p className="text-sm text-gray-600">Tổng số</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {importResult.successful}
                </p>
                <p className="text-sm text-gray-600">Thành công</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {importResult.failed}
                </p>
                <p className="text-sm text-gray-600">Thất bại</p>
              </div>
            </div>

            {/* Results table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Dòng</th>
                      <th className="px-3 py-2 text-left">Họ tên</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Trạng thái</th>
                      <th className="px-3 py-2 text-left">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.results.map((result, idx) => (
                      <tr
                        key={idx}
                        className={result.success ? "bg-green-50" : "bg-red-50"}
                      >
                        <td className="px-3 py-2">{result.row}</td>
                        <td className="px-3 py-2">{result.name}</td>
                        <td className="px-3 py-2">{result.email}</td>
                        <td className="px-3 py-2">
                          {result.success ? (
                            <span className="text-green-600">✅ OK</span>
                          ) : (
                            <span className="text-red-600">❌ Lỗi</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {result.success ? (
                            <span className="text-gray-500">
                              MK:{" "}
                              <code className="bg-gray-100 px-1">
                                {result.tempPassword}
                              </code>
                            </span>
                          ) : (
                            <span className="text-red-600">{result.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownloadResults}
              >
                📥 Tải kết quả (CSV)
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleClose}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
