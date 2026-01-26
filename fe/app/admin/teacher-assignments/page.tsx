'use client';

import { useState, useEffect } from 'react';
import {
    teacherAssignmentService,
    Assignment,
    Submission,
    CreateAssignmentDto,
} from '@/lib/services/teacher-assignment.service';

export default function TeacherAssignmentsPage() {
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Bài Tập</h1>
                    <p className="text-gray-600 mt-2">Giao bài và chấm điểm cho học sinh</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                    + Tạo Bài Mới
                </button>
            </div>

            {/* Assignments Table */}
            {assignments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
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
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
                        >
                            + Tạo Bài Mới
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tên Bài
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lớp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Môn
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loại
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hạn Nộp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Điểm
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành Động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assignments.map((assignment) => (
                                <tr key={assignment._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                                        {assignment.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                {assignment.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {assignment.classId.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {assignment.subjectId?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.type === 'test'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}
                                        >
                                            {assignment.type === 'test' ? 'Kiểm tra' : 'Bài tập'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {assignment.maxScore}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
            )}

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <CreateAssignmentModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadAssignments();
                    }}
                />
            )}

            {/* Submissions Modal */}
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

            {/* Grade Modal */}
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
    const [formData, setFormData] = useState<Partial<CreateAssignmentDto>>({
        type: 'assignment',
        maxScore: 10,
    });
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setLoading(true);
            await teacherAssignmentService.createAssignment(formData as CreateAssignmentDto);
            onSuccess();
        } catch (error) {
            console.error('Failed to create assignment:', error);
            alert('Không thể tạo bài tập. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Tạo Bài Tập Mới</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên Bài <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Bài tập tuần 3"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô Tả
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Giải các bài tập từ 1-10..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lớp <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.classId || ''}
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Chọn lớp</option>
                                {classes.map((cls) => (
                                    <option key={cls._id} value={cls._id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Loại <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.type || 'assignment'}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="assignment">Bài tập</option>
                                <option value="test">Kiểm tra</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hạn Nộp <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.dueDate || ''}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Điểm Tối Đa <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.maxScore || 10}
                                onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang tạo...' : 'Tạo Bài'}
                        </button>
                    </div>
                </form>
            </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">{assignment.title}</h2>
                        <p className="text-gray-600 mt-1">
                            {assignment.classId.name} - {assignment.subjectId?.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {submissions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Chưa có học sinh nào nộp bài</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Học Sinh
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Nộp Lúc
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Trạng Thái
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
                                {submissions.map((submission) => (
                                    <tr key={submission._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {submission.studentId.name}
                                            </div>
                                            <div className="text-sm text-gray-500">{submission.studentId.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${submission.status === 'submitted'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {submission.status === 'submitted' ? 'Đúng hạn' : 'Trễ'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {submission.graded ? (
                                                <span className="text-green-600 font-medium">
                                                    {submission.grade}/{submission.maxScore}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Chưa chấm</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <a
                                                href={submission.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Xem File
                                            </a>
                                            {!submission.graded && (
                                                <button
                                                    onClick={() => onGrade(submission)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Chấm Điểm
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
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
    onSubmit: (score: number, feedback?: string) => void;
}) {
    const [score, setScore] = useState<number>(maxScore);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (score > maxScore) {
            alert(`Điểm không được vượt quá ${maxScore}`);
            return;
        }

        setLoading(true);
        await onSubmit(score, feedback);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Chấm Bài</h2>
                <p className="text-gray-600 mb-6">
                    Học sinh: <span className="font-medium">{submission.studentId.name}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Điểm (Tối đa: {maxScore})
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={maxScore}
                            step="0.5"
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
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
                            placeholder="Bài làm tốt, cần cải thiện..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang chấm...' : '✓ Xác Nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
