'use client';

import { useState, useEffect } from 'react';
import {
    teacherAssignmentService,
    Assignment,
    Submission,
    CreateAssignmentDto,
} from '@/lib/services/teacher-assignment.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TeacherAssignmentsTab() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    // Load assignments
    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            const data = await teacherAssignmentService.getMyAssignments();
            setAssignments(data);
        } catch (error) {
            console.error('Failed to load assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSubmissions = async (assignment: Assignment) => {
        try {
            setSelectedAssignment(assignment);
            setLoading(true);
            const data = await teacherAssignmentService.getSubmissions(assignment._id);
            setSubmissions(data);
            setShowSubmissionsModal(true);
        } catch (error) {
            console.error('Failed to load submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrade = (submission: Submission) => {
        setSelectedSubmission(submission);
        setShowGradeModal(true);
    };

    const handleSubmitGrade = async (score: number, feedback?: string) => {
        if (!selectedSubmission) return;

        try {
            await teacherAssignmentService.gradeSubmission({
                submissionId: selectedSubmission._id,
                score,
                feedback,
            });

            // Reload submissions
            if (selectedAssignment) {
                const data = await teacherAssignmentService.getSubmissions(selectedAssignment._id);
                setSubmissions(data);
            }

            setShowGradeModal(false);
            setSelectedSubmission(null);
        } catch (error) {
            console.error('Failed to grade submission:', error);
            alert('Không thể chấm bài. Vui lòng thử lại.');
        }
    };

    if (loading && assignments.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quản lý Bài Tập</h2>
                    <p className="text-gray-600 mt-1">Giao bài và chấm điểm cho học sinh</p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    + Tạo Bài Mới
                </Button>
            </div>

            {/* Assignments Table */}
            {assignments.length === 0 ? (
                <Card className="p-12 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có bài tập nào</h3>
                    <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo bài tập mới.</p>
                    <div className="mt-6">
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            + Tạo Bài Mới
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tên Bài
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Lớp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Môn
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Loại
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Hạn Nộp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Điểm
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Hành Động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {assignments.map((assignment) => (
                                    <tr key={assignment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                                            {assignment.description && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {assignment.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {assignment.classId.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {assignment.subjectId?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.type === 'test'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}
                                            >
                                                {assignment.type === 'test' ? 'Kiểm tra' : 'Bài tập'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {assignment.maxScore}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleViewSubmissions(assignment)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Xem Bài Nộp
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateAssignmentModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadAssignments();
                    }}
                />
            )}

            {showSubmissionsModal && selectedAssignment && (
                <SubmissionsModal
                    assignment={selectedAssignment}
                    submissions={submissions}
                    onClose={() => {
                        setShowSubmissionsModal(false);
                        setSelectedAssignment(null);
                    }}
                    onGrade={handleGrade}
                />
            )}

            {showGradeModal && selectedSubmission && selectedAssignment && (
                <GradeModal
                    submission={selectedSubmission}
                    maxScore={selectedAssignment.maxScore}
                    onClose={() => {
                        setShowGradeModal(false);
                        setSelectedSubmission(null);
                    }}
                    onSubmit={handleSubmitGrade}
                />
            )}
        </div>
    );
}

// Create Assignment Modal Component
function CreateAssignmentModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        classId: '',
        type: 'assignment' as 'assignment' | 'test',
        dueDate: '',
        maxScore: 10,
    });

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            const data = await teacherAssignmentService.getMyClasses();
            setClasses(data);
        } catch (error) {
            console.error('Failed to load classes:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.classId || !formData.dueDate) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setLoading(true);

            // Convert datetime-local to ISO 8601
            const dueDateISO = new Date(formData.dueDate).toISOString();

            await teacherAssignmentService.createAssignment({
                ...formData,
                dueDate: dueDateISO,
            });
            onSuccess();
        } catch (error: any) {
            console.error('Failed to create assignment:', error);
            alert(`Không thể tạo bài: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Tạo Bài Mới</h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tên Bài <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="VD: Bài tập tuần 1"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mô Tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Mô tả chi tiết về bài tập..."
                            />
                        </div>

                        {/* Class */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lớp <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.classId}
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">-- Chọn lớp --</option>
                                {classes.map((cls) => (
                                    <option key={cls._id} value={cls._id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Loại <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="assignment">Bài tập</option>
                                <option value="test">Kiểm tra</option>
                            </select>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hạn Nộp <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Max Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Điểm Tối Đa <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={formData.maxScore}
                                onChange={(e) => setFormData({ ...formData, maxScore: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? 'Đang tạo...' : 'Tạo Bài'}
                            </Button>
                            <Button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                variant="outline"
                                className="flex-1"
                            >
                                Hủy
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
}

// Submissions Modal Component
function SubmissionsModal({
    assignment,
    submissions,
    onClose,
    onGrade,
}: {
    assignment: Assignment;
    submissions: Submission[];
    onClose: () => void;
    onGrade: (submission: Submission) => void;
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Bài nộp: {submissions.length} học sinh
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Chưa có học sinh nào nộp bài</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map((submission) => (
                                <div
                                    key={submission._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {submission.studentId.name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {submission.studentId.email}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Nộp: {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                                            </p>
                                            {submission.status === 'late' && (
                                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                    Trễ hạn
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={submission.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                Xem File
                                            </a>
                                            {!submission.graded && (
                                                <button
                                                    onClick={() => onGrade(submission)}
                                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Chấm Điểm
                                                </button>
                                            )}
                                            {submission.graded && (
                                                <div className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                                                    Điểm: {submission.grade}/{submission.maxScore}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6">
                        <Button onClick={onClose} variant="outline" className="w-full">
                            Đóng
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// Grade Modal Component
function GradeModal({
    submission,
    maxScore,
    onClose,
    onSubmit,
}: {
    submission: Submission;
    maxScore: number;
    onClose: () => void;
    onSubmit: (score: number, feedback?: string) => Promise<void>;
}) {
    const [score, setScore] = useState<number>(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (score < 0 || score > maxScore) {
            alert(`Điểm phải từ 0 đến ${maxScore}`);
            return;
        }

        try {
            setLoading(true);
            await onSubmit(score, feedback);
        } catch (error) {
            console.error('Failed to grade:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Chấm Điểm</h3>

                    <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium text-gray-900">{submission.studentId.name}</p>
                        <p className="text-xs text-gray-600">{submission.studentId.email}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Điểm <span className="text-red-500">*</span>
                                <span className="text-gray-500 ml-2">(Tối đa: {maxScore})</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={maxScore}
                                step="0.5"
                                value={score}
                                onChange={(e) => setScore(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nhận Xét
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Nhận xét về bài làm của học sinh..."
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu Điểm'}
                            </Button>
                            <Button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                variant="outline"
                                className="flex-1"
                            >
                                Hủy
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
}
