import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
  ) {}

  /**
   * Tạo bài tập/bài kiểm tra mới
   */
  async create(user: UserDocument, dto: CreateAssignmentDto) {
    const assignment = new this.assignmentModel({
      ...dto,
      classId: new Types.ObjectId(dto.classId),
      subjectId: dto.subjectId ? new Types.ObjectId(dto.subjectId) : undefined,
      dueDate: new Date(dto.dueDate),
      createdBy: user._id,
    });

    await assignment.save();

    return this.assignmentModel
      .findById(assignment._id)
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('createdBy', 'name email')
      .exec();
  }

  /**
   * Lấy danh sách bài tập theo lớp
   */
  async findByClass(classId: string) {
    return this.assignmentModel
      .find({ classId: new Types.ObjectId(classId) })
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('createdBy', 'name email')
      .sort({ dueDate: -1 })
      .exec();
  }

  /**
   * Lấy bài tập theo ID
   */
  async findOne(id: string) {
    const assignment = await this.assignmentModel
      .findById(id)
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('createdBy', 'name email')
      .exec();

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }

  /**
   * Cập nhật bài tập
   */
  async update(id: string, dto: UpdateAssignmentDto) {
    const updateData: any = { ...dto };

    if (dto.classId) {
      updateData.classId = new Types.ObjectId(dto.classId);
    }
    if (dto.subjectId) {
      updateData.subjectId = new Types.ObjectId(dto.subjectId);
    }
    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    const updated = await this.assignmentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('createdBy', 'name email')
      .exec();

    if (!updated) {
      throw new NotFoundException('Assignment not found');
    }

    return updated;
  }

  /**
   * Xóa bài tập
   */
  async remove(id: string) {
    const deleted = await this.assignmentModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException('Assignment not found');
    }

    return { message: 'Assignment deleted successfully', id };
  }
}
