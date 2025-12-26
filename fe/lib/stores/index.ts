// Export all stores from a single entry point
export {
  useAuthStore,
  type User,
  type UserRole,
  type AuthState,
} from "./auth-store";
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
