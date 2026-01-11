import { create } from "zustand";
import api from "@/lib/api";

export interface ChildInfo {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  studentCode?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}

export interface ChildClassInfo {
  _id: string;
  name: string;
  description?: string;
  subject?: string;
  teacherName: string;
  teacherId?: string;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  }>;
  studentCount: number;
}

export interface ChildSession {
  _id: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string;
  status: "scheduled" | "completed" | "cancelled";
  attendanceStatus?: "present" | "absent" | "late" | "excused" | null;
}

export interface ChildGrade {
  _id: string;
  title: string;
  className: string;
  score: number;
  maxScore: number;
  percentage: number;
  assessedAt: string;
}

export interface ParentDashboardData {
  child: ChildInfo | null;
  classes: ChildClassInfo[];
  upcomingSessions: ChildSession[];
  recentGrades: ChildGrade[];
  attendanceStats: {
    present: number;
    absent: number;
    late: number;
    total: number;
    rate: number;
  };
  tuitionStatus: Array<{
    _id: string;
    className: string;
    amount: number;
    period: string;
    dueDate: string;
    status: "pending" | "paid" | "overdue";
  }>;
}

interface ParentDashboardState {
  data: ParentDashboardData | null;
  isLoading: boolean;
  error: string | null;
}

interface ParentDashboardActions {
  fetchDashboardData: (parentId: string, childEmail?: string) => Promise<void>;
  clearError: () => void;
}

export const useParentDashboardStore = create<
  ParentDashboardState & ParentDashboardActions
>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboardData: async (parentId: string, childEmail?: string) => {
    set({ isLoading: true, error: null });

    try {
      // First, get the child info
      let childId: string | null = null;
      let childInfo: ChildInfo | null = null;

      if (childEmail) {
        // If childEmail is provided, find the child
        try {
          const childRes = await api.get("/users", {
            params: { email: childEmail, role: "student" },
          });
          if (childRes.data?.users?.length > 0) {
            const child = childRes.data.users[0];
            childId = child._id;
            childInfo = {
              _id: child._id,
              name: child.name,
              email: child.email,
              phone: child.phone,
              studentCode: child.studentCode,
              dateOfBirth: child.dateOfBirth,
              avatarUrl: child.avatarUrl,
            };
          }
        } catch (e) {
          console.error("Error fetching child info:", e);
        }
      }

      if (!childId) {
        // No child found
        set({
          data: {
            child: null,
            classes: [],
            upcomingSessions: [],
            recentGrades: [],
            attendanceStats: {
              present: 0,
              absent: 0,
              late: 0,
              total: 0,
              rate: 0,
            },
            tuitionStatus: [],
          },
          isLoading: false,
        });
        return;
      }

      // Fetch data for the child (similar to student dashboard)
      const [
        classesRes,
        sessionsRes,
        assessmentsRes,
        attendanceRes,
        tuitionRes,
      ] = await Promise.allSettled([
        api.get("/classes", { params: { studentId: childId } }),
        api.get("/sessions", {
          params: { studentId: childId, status: "scheduled", limit: 10 },
        }),
        api.get("/assessments", { params: { studentId: childId, limit: 10 } }),
        api.get("/attendance/statistics", { params: { studentId: childId } }),
        api.get("/tuition", {
          params: { studentId: childId, status: "pending" },
        }),
      ]);

      // Process classes
      const classes =
        classesRes.status === "fulfilled"
          ? Array.isArray(classesRes.value.data)
            ? classesRes.value.data
            : classesRes.value.data.classes || []
          : [];

      // Process sessions with attendance
      const sessionsRaw =
        sessionsRes.status === "fulfilled"
          ? Array.isArray(sessionsRes.value.data)
            ? sessionsRes.value.data
            : sessionsRes.value.data.sessions || []
          : [];

      // Fetch attendance records for the child
      let attendanceRecords: any[] = [];
      try {
        const attendanceRecordsRes = await api.get("/attendance", {
          params: { studentId: childId },
        });
        attendanceRecords = Array.isArray(attendanceRecordsRes.data)
          ? attendanceRecordsRes.data
          : attendanceRecordsRes.data.attendance || [];
      } catch (e) {
        console.error("Error fetching attendance records:", e);
      }

      const upcomingSessions = sessionsRaw.map((s: any) => {
        const attendanceRecord = attendanceRecords.find(
          (r: any) => r.sessionId === s._id
        );
        return {
          _id: s._id,
          classId: s.classId?._id || s.classId,
          className: s.class?.name || s.classId?.name || "Lớp học",
          date: s.date || s.startTime,
          startTime: s.startTime,
          endTime: s.endTime,
          topic: s.topic,
          status: s.status,
          attendanceStatus: attendanceRecord?.status || null,
        };
      });

      // Process assessments
      const assessmentsRaw =
        assessmentsRes.status === "fulfilled"
          ? Array.isArray(assessmentsRes.value.data)
            ? assessmentsRes.value.data
            : assessmentsRes.value.data.assessments || []
          : [];

      const recentGrades = assessmentsRaw.map((a: any) => ({
        _id: a._id,
        title: a.title,
        className: a.class?.name || "N/A",
        score: a.score,
        maxScore: a.maxScore,
        percentage: (a.score / a.maxScore) * 100,
        assessedAt: a.assessedAt,
      }));

      // Process attendance stats
      const attendanceStats =
        attendanceRes.status === "fulfilled"
          ? attendanceRes.value.data
          : { present: 0, absent: 0, late: 0, total: 0, rate: 0 };

      // Process tuition
      const tuitionRaw =
        tuitionRes.status === "fulfilled"
          ? Array.isArray(tuitionRes.value.data)
            ? tuitionRes.value.data
            : tuitionRes.value.data.tuition || []
          : [];

      const tuitionStatus = tuitionRaw.map((t: any) => ({
        _id: t._id,
        className: t.class?.name || "N/A",
        amount: t.amount,
        period: t.period,
        dueDate: t.dueDate,
        status: t.status,
      }));

      set({
        data: {
          child: childInfo,
          classes: classes.map((c: any) => ({
            _id: c._id,
            name: c.name,
            description: c.description,
            subject: c.subject,
            teacherName: c.teacher?.name || "N/A",
            teacherId: c.teacher?._id || c.teacherId,
            schedule: c.schedule || [],
            studentCount: c.studentIds?.length || 0,
          })),
          upcomingSessions,
          recentGrades,
          attendanceStats,
          tuitionStatus,
        },
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Lỗi khi tải dữ liệu dashboard";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
