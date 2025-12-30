"use client";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useScheduleStore,
  Session,
  SessionType,
  getTypeColor,
  getSessionClassName,
  getSessionTeacherName,
  formatSessionTime,
} from "@/lib/stores/schedule-store";
import { useClassesStore, Class } from "@/lib/stores/classes-store";
import { useBranchesStore } from "@/lib/stores/branches-store";
import { useUsersStore } from "@/lib/stores/users-store";
import SessionFormModal from "./session-form-modal";
import GenerateSessionsModal from "./generate-sessions-modal";

interface ScheduleManagerProps {
  userRole?: string;
  userId?: string;
}

// Helper để lấy ngày đầu tuần (Thứ 2)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper để lấy ngày cuối tuần (Chủ nhật)
const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Helper format date
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00
const DAYS_OF_WEEK = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "CN",
];

export default function ScheduleManager({
  userRole = "admin",
  userId,
}: ScheduleManagerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month" | "list">("week");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("");
  const [selectedTeacherFilter, setSelectedTeacherFilter] =
    useState<string>("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("");

  // Stores
  const {
    sessions,
    isLoading,
    error,
    statistics,
    fetchSchedule,
    fetchStatistics,
    updateSession,
    deleteSession,
    clearError,
  } = useScheduleStore();

  const { classes, fetchClasses } = useClassesStore();
  const { branches, fetchBranches } = useBranchesStore();
  const { users, fetchUsers } = useUsersStore();

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      return {
        start: getStartOfWeek(currentDate),
        end: getEndOfWeek(currentDate),
      };
    } else {
      // Month view
      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }, [currentDate, viewMode]);

  // Fetch data on mount
  useEffect(() => {
    fetchClasses().catch(console.error);
    fetchBranches().catch(console.error);
    fetchUsers({ role: "teacher" }).catch(console.error);
  }, [fetchClasses, fetchBranches, fetchUsers]);

  // Fetch schedule when date range or filters change
  useEffect(() => {
    const query: any = {
      startDate: formatDate(dateRange.start),
      endDate: formatDate(dateRange.end),
    };
    if (selectedClassFilter) query.classId = selectedClassFilter;
    if (selectedTeacherFilter) query.teacherId = selectedTeacherFilter;
    if (selectedBranchFilter) query.branchId = selectedBranchFilter;

    fetchSchedule(query).catch(console.error);
    fetchStatistics(
      formatDate(dateRange.start),
      formatDate(dateRange.end),
      selectedBranchFilter || undefined
    ).catch(console.error);
  }, [
    dateRange,
    selectedClassFilter,
    selectedTeacherFilter,
    selectedBranchFilter,
    fetchSchedule,
    fetchStatistics,
  ]);

  // Get teachers from users
  const teachers = useMemo(() => {
    return users.filter((u) => u.role === "teacher");
  }, [users]);

  // Navigate week/month
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get sessions for a specific day and hour
  const getSessionsForSlot = (dayIndex: number, hour: number): Session[] => {
    const targetDate = new Date(dateRange.start);
    targetDate.setDate(targetDate.getDate() + dayIndex);

    return sessions.filter((session) => {
      const sessionStart = new Date(session.startTime);
      const sessionHour = sessionStart.getHours();
      const sessionDate = sessionStart.toDateString();
      return sessionDate === targetDate.toDateString() && sessionHour === hour;
    });
  };

  // Get sessions for a specific date (for month view)
  const getSessionsForDate = (date: Date): Session[] => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.startTime).toDateString();
      return sessionDate === date.toDateString();
    });
  };

  // Handle session actions
  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setShowCreateModal(true);
  };

  const handleDeleteSession = async (session: Session) => {
    if (confirm("Bạn có chắc muốn xóa buổi học này?")) {
      try {
        await deleteSession(session._id);
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingSession(null);
  };

  // Render session card
  const renderSessionCard = (session: Session, compact = false) => {
    const className = getSessionClassName(session);
    const teacherName = getSessionTeacherName(session);
    const timeStr = formatSessionTime(session);

    if (compact) {
      return (
        <div
          key={session._id}
          className={`p-1.5 rounded text-xs cursor-pointer hover:opacity-80 ${getTypeColor(
            session.type
          )}`}
          onClick={() => handleEditSession(session)}
          title={`${className} - ${teacherName}\n${timeStr}`}
        >
          <div className="font-medium truncate">{className}</div>
          <div className="text-[10px] opacity-70">{timeStr}</div>
        </div>
      );
    }

    return (
      <Card
        key={session._id}
        className="p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
        onClick={() => handleEditSession(session)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {className}
            </div>
            <div className="text-sm text-gray-600">{teacherName}</div>
            <div className="text-sm text-gray-500 mt-1">{timeStr}</div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                  session.type
                )}`}
              >
                {session.type === SessionType.Regular
                  ? "Thường"
                  : session.type === SessionType.Makeup
                  ? "Học bù"
                  : "Kiểm tra"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSession(session);
              }}
            >
              ✕
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(dateRange.start);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header với ngày */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="p-2 text-center text-sm font-medium text-gray-500">
              Giờ
            </div>
            {weekDates.map((date, i) => (
              <div
                key={i}
                className={`p-2 text-center rounded-lg ${
                  date.toDateString() === new Date().toDateString()
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-50"
                }`}
              >
                <div className="text-xs text-gray-500">{DAYS_OF_WEEK[i]}</div>
                <div className="font-semibold">{date.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="border rounded-xl overflow-hidden bg-white">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b last:border-b-0"
              >
                <div className="p-2 text-xs text-gray-400 border-r bg-gray-50 text-center">
                  {hour}:00
                </div>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const slotSessions = getSessionsForSlot(dayIndex, hour);
                  return (
                    <div
                      key={dayIndex}
                      className="min-h-[60px] p-1 border-r last:border-r-0 hover:bg-gray-50"
                    >
                      {slotSessions.map((session) =>
                        renderSessionCard(session, true)
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = lastDay.getDate();

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Fill empty days at start
    for (let i = 0; i < startDayOfWeek; i++) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - (startDayOfWeek - i));
      currentWeek.push(d);
    }

    // Fill days of month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining days
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(year, month + 1, nextDay++));
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="grid grid-cols-7 border-b last:border-b-0"
          >
            {week.map((date, dayIndex) => {
              const isCurrentMonth = date.getMonth() === month;
              const isToday = date.toDateString() === new Date().toDateString();
              const daySessions = getSessionsForDate(date);

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[100px] p-1 border-r last:border-r-0 ${
                    !isCurrentMonth ? "bg-gray-50" : ""
                  }`}
                >
                  <div
                    className={`text-sm mb-1 text-center ${
                      isToday
                        ? "w-6 h-6 rounded-full bg-blue-600 text-white mx-auto flex items-center justify-center"
                        : !isCurrentMonth
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {daySessions
                      .slice(0, 3)
                      .map((session) => renderSessionCard(session, true))}
                    {daySessions.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{daySessions.length - 3} khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    const groupedByDate = sessions.reduce((acc, session) => {
      const dateKey = new Date(session.startTime).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(session);
      return acc;
    }, {} as Record<string, Session[]>);

    const sortedDates = Object.keys(groupedByDate).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    if (sortedDates.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📅</div>
          <p>Không có buổi học nào trong khoảng thời gian này</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sortedDates.map((dateKey) => (
          <div key={dateKey}>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {new Date(dateKey).toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
              <span className="text-sm font-normal text-gray-400">
                ({groupedByDate[dateKey].length} buổi)
              </span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupedByDate[dateKey].map((session) =>
                renderSessionCard(session)
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📅 Quản lý Lịch dạy học
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Sắp xếp và quản lý lịch dạy của giáo viên và học sinh
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            ➕ Thêm buổi học
          </Button>
          {userRole === "admin" && (
            <Button
              variant="outline"
              onClick={() => setShowGenerateModal(true)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              ⚡ Tạo tự động
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="text-sm text-gray-600">Tổng buổi học</div>
            <div className="text-2xl font-bold text-blue-700">
              {statistics.total}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả lớp</option>
            {classes.map((c: Class) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả giáo viên</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả cơ sở</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          {(selectedClassFilter ||
            selectedTeacherFilter ||
            selectedBranchFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedClassFilter("");
                setSelectedTeacherFilter("");
                setSelectedBranchFilter("");
              }}
              className="text-gray-500"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {/* Navigation & View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrev}>
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hôm nay
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            →
          </Button>
          <span className="ml-2 font-semibold text-gray-700">
            {viewMode === "week"
              ? `${formatDisplayDate(dateRange.start)} - ${formatDisplayDate(
                  dateRange.end
                )}`
              : currentDate.toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
          </span>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "week" | "month" | "list")}
        >
          <TabsList className="bg-gray-100">
            <TabsTrigger value="week" className="text-sm">
              📅 Tuần
            </TabsTrigger>
            <TabsTrigger value="month" className="text-sm">
              📆 Tháng
            </TabsTrigger>
            <TabsTrigger value="list" className="text-sm">
              📋 Danh sách
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <Button variant="outline" size="sm" onClick={clearError}>
            Đóng
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Đang tải...</p>
        </div>
      )}

      {/* Calendar Views */}
      {!isLoading && (
        <Card className="p-4">
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
          {viewMode === "list" && renderListView()}
        </Card>
      )}

      {/* Modals */}
      {showCreateModal && (
        <SessionFormModal
          session={editingSession}
          classes={classes}
          teachers={users.filter((u) => u.role === "teacher")}
          onClose={handleCloseModal}
        />
      )}

      {showGenerateModal && (
        <GenerateSessionsModal
          classes={classes}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}
