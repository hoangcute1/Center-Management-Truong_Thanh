import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from './schemas/expense.schema';
import { CreateExpenseDto, GetExpensesQueryDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(dto: CreateExpenseDto, userId: string): Promise<Expense> {
    // Validate branchId không được là "ALL"
    if (dto.branchId === 'ALL') {
      throw new BadRequestException('Không thể thêm chi phí cho tất cả cơ sở');
    }

    // Validate amount
    if (dto.amount <= 0) {
      throw new BadRequestException('Số tiền phải lớn hơn 0');
    }

    // Validate description
    if (!dto.description || dto.description.trim().length === 0) {
      throw new BadRequestException('Vui lòng nhập nội dung chi phí');
    }

    const expense = new this.expenseModel({
      branchId: new Types.ObjectId(dto.branchId),
      amount: dto.amount,
      description: dto.description.trim(),
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
      createdBy: new Types.ObjectId(userId),
    });

    return expense.save();
  }

  async findByBranch(query: GetExpensesQueryDto): Promise<{ expenses: Expense[]; total: number }> {
    const { branchId, from, to, limit = 50 } = query;

    if (branchId === 'ALL') {
      throw new BadRequestException('Không thể lấy chi phí của tất cả cơ sở');
    }

    const match: any = {
      branchId: new Types.ObjectId(branchId),
    };

    if (from || to) {
      match.expenseDate = {};
      if (from) match.expenseDate.$gte = new Date(from);
      if (to) match.expenseDate.$lte = new Date(to);
    }

    const expenses = await this.expenseModel
      .find(match)
      .populate('createdBy', 'name email')
      .sort({ expenseDate: -1 })
      .limit(limit)
      .lean();

    const total = await this.expenseModel.countDocuments(match);

    return { expenses, total };
  }

  async delete(id: string, userId: string): Promise<void> {
    const expense = await this.expenseModel.findById(id);
    if (!expense) {
      throw new NotFoundException('Không tìm thấy chi phí');
    }

    await this.expenseModel.findByIdAndDelete(id);
  }
}
