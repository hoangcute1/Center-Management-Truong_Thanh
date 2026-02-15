// Export all stores from a single entry point
export { useAuthStore, type User, type UserRole } from "./auth-store";
export { useUsersStore } from "./users-store";
export { useBranchesStore, type Branch } from "./branches-store";
export {
  useClassesStore,
  type Class,
  type ClassSchedule,
} from "./classes-store";
export {
  useNotificationsStore,
  type Notification,
} from "./notifications-store";
export { useAttendanceStore, type AttendanceRecord } from "./attendance-store";
export { useAssessmentsStore, type Assessment } from "./assessments-store";
export { useTuitionStore, type TuitionRecord } from "./tuition-store";
export {
  useStudentDashboardStore,
  type StudentDashboardData,
  type Session,
} from "./student-dashboard-store";
export {
  useScheduleStore,
  SessionStatus,
  SessionType,
  type Session as ScheduleSession,
  type CreateSessionData,
  type UpdateSessionData,
  type ScheduleQuery,
} from "./schedule-store";
export { useChatStore } from "./chat-store";
export { useAdminStatsStore, type DashboardOverviewResponse } from "./admin-stats-store";
export { useLeaderboardStore } from "./leaderboard-store";
