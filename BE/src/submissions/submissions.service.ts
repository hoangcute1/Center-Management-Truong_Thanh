import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Submission, SubmissionDocument, SubmissionStatus } from './schemas/submission.schema';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { Assignment, AssignmentDocument } from '../assignments/schemas/assignment.schema';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
  ) {}

  /**
   * Nộp bài - Logic xác định submitted hoặc late
   */
  async create(user: UserDocument, dto: CreateSubmissionDto) {
    // 1. Lấy thông tin assignment để check deadline
    const assignment = await this.assignmentModel
      .findById(dto.assignmentId)
      .exec();

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // 2. Check xem học sinh đã nộp bài này chưa
    const existing = await this.submissionModel
      .findOne({
        assignmentId: new Types.ObjectId(dto.assignmentId),
        studentId: user._id,
      })
      .exec();

    if (existing) {
      throw new BadRequestException('You have already submitted this assignment');
    }

    // 3. Xác định status: submitted (đúng hạn) hoặc late (trễ)
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const status: SubmissionStatus = now <= dueDate 
      ? SubmissionStatus.Submitted 
      : SubmissionStatus.Late;

    // 4. Tạo submission
    const submission = new this.submissionModel({
      assignmentId: new Types.ObjectId(dto.assignmentId),
      studentId: user._id,
      fileUrl: dto.fileUrl,
      submittedAt: now,
      status,
    });

    await submission.save();

    // 5. Populate và trả về
    return this.submissionModel
      .findById(submission._id)
      .populate('assignmentId', 'title dueDate maxScore type')
      .populate('studentId', 'name email')
      .exec();
  }

  /**
   * Lấy danh sách submissions theo assignment
   * (Giáo viên xem ai đã nộp)
   */
  async findByAssignment(assignmentId: string) {
    return this.submissionModel
      .find({ assignmentId: new Types.ObjectId(assignmentId) })
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title dueDate')
      .sort({ submittedAt: -1 })
      .exec();
  }

  /**
   * Lấy lịch sử nộp bài của học sinh
   */
  async findByStudent(studentId: string) {
    return this.submissionModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('assignmentId', 'title dueDate maxScore type')
      .sort({ submittedAt: -1 })
      .exec();
  }

  /**
   * Lấy chi tiết một submission
   */
  async findOne(id: string) {
    const submission = await this.submissionModel
      .findById(id)
      .populate('assignmentId', 'title dueDate maxScore type description')
      .populate('studentId', 'name email')
      .exec();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  /**
   * Thống kê submission của học sinh
   * (Để tính chăm chỉ cho leaderboard)
   */
  async getStudentStats(studentId: string) {
    const submissions = await this.submissionModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .exec();

    const total = submissions.length;
    const onTime = submissions.filter(s => s.status === SubmissionStatus.Submitted).length;
    const late = submissions.filter(s => s.status === SubmissionStatus.Late).length;
    const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

    return {
      total,
      onTime,
      late,
      onTimeRate,
    };
  }
}
