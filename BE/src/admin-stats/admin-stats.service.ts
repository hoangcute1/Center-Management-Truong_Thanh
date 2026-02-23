import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ClassEntity, ClassDocument } from '../classes/schemas/class.schema';
import { Payment, PaymentDocument, PaymentStatus } from '../payments/schemas/payment.schema';
import { Attendance, AttendanceDocument } from '../attendance/schemas/attendance.schema';
import { Grade, GradeDocument } from '../grades/schemas/grade.schema';
import { UserRole } from '../common/enums/role.enum';

export interface OverviewStats {
  students: {
    total: number;
    newThisMonth: number;
    trend: string;
  };
  teachers: {
    total: number;
    active: number;
  };
  classes: {
    total: number;
    active: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    trend: string;
  };
}

export interface AttendanceStats {
  totalSessions: number;
  totalPresent: number;
  rate: number;
}

export interface GradeStats {
  averageScore: number;
  totalGrades: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface StudentsBySubject {
  name: string;
  value: number;
}

export interface DashboardOverviewResponse {
  overview: OverviewStats;
  attendanceRate: number;
  averageScore: number;
  newStudentsThisMonth: number;
  revenueByMonth: RevenueByMonth[];
  studentsBySubject: StudentsBySubject[];
}

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ClassEntity.name) private classModel: Model<ClassDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Grade.name) private gradeModel: Model<GradeDocument>,
  ) {}

  async getDashboardOverview(branchId?: string): Promise<DashboardOverviewResponse> {
    const branchFilter = branchId ? { branchId: new Types.ObjectId(branchId) } : {};

    // 1. Get student stats
    const studentStats = await this.getStudentStats(branchFilter);

    // 2. Get teacher stats
    const teacherStats = await this.getTeacherStats(branchFilter);

    // 3. Get class stats
    const classStats = await this.getClassStats(branchFilter);

    // 4. Get revenue stats
    const revenueStats = await this.getRevenueStats(branchId);

    // 5. Get attendance rate (overall)
    const attendanceRate = await this.getOverallAttendanceRate();

    // 6. Get average score
    const averageScore = await this.getAverageScore();

    // 7. Get revenue by month (last 6 months)
    const revenueByMonth = await this.getRevenueByMonth(branchId);

    // 8. Get students distribution by subject/class
    const studentsBySubject = await this.getStudentsBySubject(branchFilter);

    return {
      overview: {
        students: studentStats,
        teachers: teacherStats,
        classes: classStats,
        revenue: revenueStats,
      },
      attendanceRate,
      averageScore,
      newStudentsThisMonth: studentStats.newThisMonth,
      revenueByMonth,
      studentsBySubject,
    };
  }

  private async getStudentStats(branchFilter: any) {
    const total = await this.userModel.countDocuments({
      role: UserRole.Student,
      status: { $ne: 'inactive' },
      ...branchFilter,
    });

    // Students created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await this.userModel.countDocuments({
      role: UserRole.Student,
      createdAt: { $gte: startOfMonth },
      ...branchFilter,
    });

    // Students created last month for trend calculation
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    const endOfLastMonth = new Date(startOfMonth);
    endOfLastMonth.setMilliseconds(-1);

    const lastMonthTotal = await this.userModel.countDocuments({
      role: UserRole.Student,
      createdAt: { $lt: startOfMonth },
      ...branchFilter,
    });

    const previousMonthNew = await this.userModel.countDocuments({
      role: UserRole.Student,
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      ...branchFilter,
    });

    let trend = '+0%';
    if (previousMonthNew > 0) {
      const change = Math.round(((newThisMonth - previousMonthNew) / previousMonthNew) * 100);
      trend = change >= 0 ? `+${change}%` : `${change}%`;
    } else if (newThisMonth > 0) {
      trend = '+100%';
    }

    return {
      total,
      newThisMonth,
      trend: `${trend} so với tháng trước`,
    };
  }

  private async getTeacherStats(branchFilter: any) {
    const total = await this.userModel.countDocuments({
      role: UserRole.Teacher,
      ...branchFilter,
    });

    const active = await this.userModel.countDocuments({
      role: UserRole.Teacher,
      status: 'active',
      ...branchFilter,
    });

    return { total, active };
  }

  private async getClassStats(branchFilter: any) {
    const total = await this.classModel.countDocuments(branchFilter);
    const active = await this.classModel.countDocuments({
      status: 'active',
      ...branchFilter,
    });

    return { total, active };
  }

  private async getRevenueStats(branchId?: string) {
    const now = new Date();
    
    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const matchBase: any = {
      status: PaymentStatus.SUCCESS,
    };

    // This month revenue
    const thisMonthMatch = {
      ...matchBase,
      $or: [
        { paidAt: { $gte: startOfMonth, $lte: endOfMonth } },
        { paidAt: null, createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
      ],
    };

    const pipeline: any[] = [{ $match: thisMonthMatch }];
    
    if (branchId) {
      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { branchId: new Types.ObjectId(branchId) },
              { 'student.branchId': new Types.ObjectId(branchId) },
            ],
          },
        },
      );
    }

    pipeline.push({
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    });

    const thisMonthResult = await this.paymentModel.aggregate(pipeline);
    const thisMonth = thisMonthResult[0]?.total || 0;

    // Last month revenue
    const lastMonthMatch = {
      ...matchBase,
      $or: [
        { paidAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } },
        { paidAt: null, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } },
      ],
    };

    const lastMonthPipeline: any[] = [{ $match: lastMonthMatch }];
    
    if (branchId) {
      lastMonthPipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { branchId: new Types.ObjectId(branchId) },
              { 'student.branchId': new Types.ObjectId(branchId) },
            ],
          },
        },
      );
    }

    lastMonthPipeline.push({
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    });

    const lastMonthResult = await this.paymentModel.aggregate(lastMonthPipeline);
    const lastMonth = lastMonthResult[0]?.total || 0;

    // Calculate trend
    let trend = '+0%';
    if (lastMonth > 0) {
      const change = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
      trend = change >= 0 ? `+${change}%` : `${change}%`;
    } else if (thisMonth > 0) {
      trend = '+100%';
    }

    return {
      thisMonth,
      lastMonth,
      trend: `${trend} so với tháng trước`,
    };
  }

  private async getOverallAttendanceRate(): Promise<number> {
    const result = await this.attendanceModel.aggregate([
      {
        $group: {
          _id: null,
          totalPresent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
            },
          },
          totalLate: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
            },
          },
          total: { $sum: 1 },
        },
      },
    ]);

    if (!result[0] || result[0].total === 0) {
      return 0;
    }

    // Count present + late as attended
    const attended = result[0].totalPresent + result[0].totalLate;
    return Math.round((attended / result[0].total) * 1000) / 10; // 1 decimal place
  }

  private async getAverageScore(): Promise<number> {
    const result = await this.gradeModel.aggregate([
      {
        $match: {
          score: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          total: { $sum: 1 },
        },
      },
    ]);

    if (!result[0] || result[0].total === 0) {
      return 0;
    }

    return Math.round(result[0].avgScore * 10) / 10; // 1 decimal place
  }

  private async getRevenueByMonth(branchId?: string): Promise<RevenueByMonth[]> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const matchBase: any = {
      status: PaymentStatus.SUCCESS,
      $or: [
        { paidAt: { $gte: sixMonthsAgo } },
        { paidAt: null, createdAt: { $gte: sixMonthsAgo } },
      ],
    };

    const pipeline: any[] = [{ $match: matchBase }];

    if (branchId) {
      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { branchId: new Types.ObjectId(branchId) },
              { 'student.branchId': new Types.ObjectId(branchId) },
            ],
          },
        },
      );
    }

    pipeline.push(
      {
        $addFields: {
          effectiveDate: { $ifNull: ['$paidAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$effectiveDate' },
            month: { $month: '$effectiveDate' },
          },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    );

    const result = await this.paymentModel.aggregate(pipeline);

    // Generate last 6 months labels
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
    ];

    const months: RevenueByMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const found = result.find(
        (r) => r._id.year === year && r._id.month === month,
      );

      months.push({
        month: monthNames[month - 1],
        revenue: found ? Math.round(found.revenue / 1000000) : 0, // Convert to millions
      });
    }

    return months;
  }

  private async getStudentsBySubject(branchFilter: any): Promise<StudentsBySubject[]> {
    // Get classes with student counts
    const classes = await this.classModel.aggregate([
      { $match: { status: 'active', ...branchFilter } },
      {
        $project: {
          subject: 1,
          studentCount: { $size: { $ifNull: ['$studentIds', []] } },
        },
      },
      {
        $group: {
          _id: '$subject',
          value: { $sum: '$studentCount' },
        },
      },
      { $sort: { value: -1 } },
    ]);

    // Map to friendly names or use original
    const subjectMap: Record<string, string> = {
      math: 'Toán',
      english: 'Anh Văn',
      physics: 'Vật Lý',
      chemistry: 'Hóa Học',
      literature: 'Văn Học',
      biology: 'Sinh Học',
      history: 'Lịch Sử',
      geography: 'Địa Lý',
    };

    const results = classes.map((c) => ({
      name: subjectMap[c._id] || c._id || 'Khác',
      value: c.value,
    }));

    // If no data, return default
    if (results.length === 0) {
      return [
        { name: 'Toán', value: 0 },
        { name: 'Anh Văn', value: 0 },
        { name: 'Khác', value: 0 },
      ];
    }

    // Limit to top 4, group rest as "Khác"
    if (results.length > 4) {
      const top3 = results.slice(0, 3);
      const others = results.slice(3).reduce((sum, r) => sum + r.value, 0);
      return [...top3, { name: 'Khác', value: others }];
    }

    return results;
  }
}
