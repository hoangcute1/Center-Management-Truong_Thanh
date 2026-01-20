import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from '../payments/schemas/payment.schema';
import { Expense, ExpenseDocument } from '../expenses/schemas/expense.schema';

interface MonthlyData {
  month: number;
  revenue: number;
  expense: number;
  profit: number;
}

export interface DashboardResponse {
  branchId: string;
  year: number;
  summary: {
    totalRevenue: number;
    totalExpense: number;
    profit: number;
  };
  chart: {
    revenueByMonth: Array<{ month: number; amount: number }>;
    expenseByMonth: Array<{ month: number; amount: number }>;
  };
  revenueBySubject: Array<{ subject: string; amount: number }>;
  detailByMonth: MonthlyData[];
}


@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  async getDashboard(branchId: string, year: number): Promise<DashboardResponse> {
    // Validate inputs
    if (!year || year < 2000 || year > 2100) {
      throw new BadRequestException('Năm không hợp lệ');
    }

    if (!branchId) {
      throw new BadRequestException('branchId là bắt buộc');
    }

    // Date range cho year
    const startDate = new Date(year, 0, 1); // Jan 1
    const endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31

    // 1. Aggregate Revenue by Month
    const revenueByMonthData = await this.aggregateRevenueByMonth(
      branchId,
      startDate,
      endDate,
    );

    // 2. Aggregate Expense by Month
    const expenseByMonthData = await this.aggregateExpenseByMonth(
      branchId,
      startDate,
      endDate,
    );

    // 3. Revenue by Subject (optional, không crash nếu lỗi)
    let revenueBySubject: Array<{ subject: string; amount: number }> = [];
    try {
      revenueBySubject = await this.aggregateRevenueBySubject(
        branchId,
        startDate,
        endDate,
      );
    } catch (error) {
      console.warn('Could not aggregate revenue by subject:', error.message);
      revenueBySubject = [];
    }


    // 4. Normalize to 12 months & calculate totals
    const detailByMonth = this.mergeMonthlyData(
      revenueByMonthData,
      expenseByMonthData,
    );

    const totalRevenue = detailByMonth.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpense = detailByMonth.reduce((sum, m) => sum + m.expense, 0);
    const profit = totalRevenue - totalExpense;

    return {
      branchId,
      year,
      summary: {
        totalRevenue,
        totalExpense,
        profit,
      },
      chart: {
        revenueByMonth: detailByMonth.map((m) => ({
          month: m.month,
          amount: m.revenue,
        })),
        expenseByMonth: detailByMonth.map((m) => ({
          month: m.month,
          amount: m.expense,
        })),
      },
      revenueBySubject,
      detailByMonth,
    };
  }

  private async aggregateRevenueByMonth(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ month: number; amount: number }>> {
    const matchStage: any = {
      status: PaymentStatus.SUCCESS,
      $or: [
        { paidAt: { $gte: startDate, $lte: endDate } },
        { paidAt: null, createdAt: { $gte: startDate, $lte: endDate } },
      ],
    };

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },
    ];

    // Filter by branch if not ALL
    if (branchId !== 'ALL') {
      pipeline.push(
        // Lookup student để lấy branchId nếu payment không có
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        // Match branchId: ưu tiên payment.branchId, fallback student.branchId
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $cond: [
                    { $ifNull: ['$branchId', false] },
                    '$branchId',
                    '$student.branchId',
                  ],
                },
                new Types.ObjectId(branchId),
              ],
            },
          },
        },
      );
    }

    // Add fields để tính effectiveDate
    pipeline.push({
      $addFields: {
        effectiveDate: { $ifNull: ['$paidAt', '$createdAt'] },
      },
    });

    // Group by month
    pipeline.push(
      {
        $group: {
          _id: { $month: '$effectiveDate' },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    );

    const result = await this.paymentModel.aggregate(pipeline);

    return result.map((r) => ({
      month: r._id,
      amount: r.amount,
    }));
  }

  private async aggregateExpenseByMonth(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ month: number; amount: number }>> {
    const matchStage: any = {
      expenseDate: { $gte: startDate, $lte: endDate },
    };

    // Filter by branch if not ALL
    if (branchId !== 'ALL') {
      matchStage.branchId = new Types.ObjectId(branchId);
    }

    const result = await this.expenseModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $month: '$expenseDate' },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((r) => ({
      month: r._id,
      amount: r.amount,
    }));
  }

  private async aggregateRevenueBySubject(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ subject: string; amount: number }>> {
    const matchStage: any = {
      status: PaymentStatus.SUCCESS,
      $or: [
        { paidAt: { $gte: startDate, $lte: endDate } },
        { paidAt: null, createdAt: { $gte: startDate, $lte: endDate } },
      ],
    };

    // Build pipeline
    const pipeline: any[] = [
      { $match: matchStage },
    ];

    // Add branch filter with fallback if not ALL
    if (branchId !== 'ALL') {
      pipeline.push(
        // Lookup student for fallback
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'studentInfo',
          },
        },
        { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
        // Match branch
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $cond: [
                    { $ifNull: ['$branchId', false] },
                    '$branchId',
                    '$studentInfo.branchId',
                  ],
                },
                new Types.ObjectId(branchId),
              ],
            },
          },
        },
      );
    }

    // Continue with request and class lookups
    pipeline.push(
      { $unwind: '$requestIds' },
      {
        $lookup: {
          from: 'studentpaymentrequests',
          localField: 'requestIds',
          foreignField: '_id',
          as: 'request',
        },
      },
      { $unwind: { path: '$request', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'classes',
          localField: 'request.classId',
          foreignField: '_id',
          as: 'class',
        },
      },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$class.subject',
          amount: {
            $sum: {
              $cond: [
                { $ifNull: ['$request.amount', false] },
                '$request.amount',
                {
                  $divide: [
                    '$amount',
                    {
                      $cond: [
                        { $gt: [{ $size: '$requestIds' }, 0] },
                        { $size: '$requestIds' },
                        1,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { amount: -1 } },
    );

    const result = await this.paymentModel.aggregate(pipeline);

    return result.map((r) => ({
      subject: r._id,
      amount: Math.round(r.amount),
    }));
  }

  private mergeMonthlyData(
    revenue: Array<{ month: number; amount: number }>,
    expense: Array<{ month: number; amount: number }>,
  ): MonthlyData[] {
    const merged: MonthlyData[] = [];

    // Create map for quick lookup
    const revenueMap = new Map(revenue.map((r) => [r.month, r.amount]));
    const expenseMap = new Map(expense.map((e) => [e.month, e.amount]));

    // Fill all 12 months
    for (let month = 1; month <= 12; month++) {
      const rev = revenueMap.get(month) || 0;
      const exp = expenseMap.get(month) || 0;

      merged.push({
        month,
        revenue: rev,
        expense: exp,
        profit: rev - exp,
      });
    }

    return merged;
  }
}
