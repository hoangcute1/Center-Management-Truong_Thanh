import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Goal, GoalDocument } from './schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(Goal.name) private readonly model: Model<GoalDocument>,
  ) {}

  async create(user: UserDocument, dto: CreateGoalDto) {
    const studentId = dto.studentId || user._id.toString();
    if (user.role === UserRole.Student && studentId !== user._id.toString()) {
      throw new NotFoundException('Students can only create their own goals');
    }
    const doc = new this.model({
      ...dto,
      studentId: new Types.ObjectId(studentId),
    });
    return doc.save();
  }

  listForUser(user: UserDocument) {
    if (user.role === UserRole.Admin || user.role === UserRole.Teacher)
      return this.model.find().exec();
    return this.model.find({ studentId: user._id }).exec();
  }

  async update(id: string, dto: UpdateGoalDto, user: UserDocument) {
    const goal = await this.model.findById(id).exec();
    if (!goal) throw new NotFoundException('Goal not found');
    if (
      user.role === UserRole.Student &&
      goal.studentId.toString() !== user._id.toString()
    ) {
      throw new NotFoundException('Goal not found');
    }
    Object.assign(goal, dto);
    return goal.save();
  }
}
